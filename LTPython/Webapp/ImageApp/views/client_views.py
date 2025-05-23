from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Prefetch
from django.utils.crypto import get_random_string
from datetime import datetime, timedelta, timezone

import jwt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password, check_password

# Import model và serializer (đảm bảo file serializers.py đã được định nghĩa)
from ImageApp.models import User, Chat, ChatTurn, ChatbotMessage, Image
from ImageApp.serializers import (
    UserSerializer, 
    ChatDetailSerializer, 
    ChatTurnSerializer, 
    ChatbotMessageSerializer,
    ImageSerializer,
    MinimalImageRecordInputSerializer
)

# New view for saving generated images
class SaveGeneratedImageAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Validate input data
            serializer = MinimalImageRecordInputSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            chat_id = validated_data['chat_id']
            prompt_text = validated_data['prompt_text']
            image_url = validated_data['image_url_cloudinary']
            sender = validated_data.get('sender', 'AI_Generated_Image')
            
            try:
                # Get the chat and verify ownership
                chat = Chat.objects.get(id=chat_id, user=user)
                
                # Create a new chat turn with the next turn number
                last_turn = ChatTurn.objects.filter(chat=chat).order_by('-turn_number').first()
                turn_number = (last_turn.turn_number + 1) if last_turn else 1
                chat_turn = ChatTurn.objects.create(chat=chat, turn_number=turn_number)
                
                # Create the image record
                image = Image.objects.create(
                    chat_turn=chat_turn,
                    sender=sender,
                    prompt_text=prompt_text,
                    image_url=image_url
                )
                
                # Return success response with the created image data
                return Response({
                    "message": "Image saved successfully",
                    "chat_turn_id": chat_turn.id,
                    "image": ImageSerializer(image).data
                }, status=status.HTTP_201_CREATED)
                
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
                
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)


class UpdateNameImageChatAPIView(APIView):
    def post(self, request, chat_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            try:
                chat = Chat.objects.get(id=chat_id, user=user)
                title = request.data.get('title')
                if not title:
                    return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)
                chat.title = title
                chat.save()
                serializer = ChatDetailSerializer(chat)
                return Response(
                    {"message": "Chat updated successfully", "chat": serializer.data},
                    status=status.HTTP_200_OK
                )
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

class ListImageChatsAPIView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Tìm các chat có ít nhất một hình ảnh
            # chats_with_images = Chat.objects.filter(
            #     user=user,
            #     chatturns__images__isnull=False
            # ).distinct().order_by('-created_at')
            
            # Hoặc có thể thêm trường is_image_chat vào model Chat để phân biệt
            chats = Chat.objects.filter(user=user, is_image_chat=True).order_by('-created_at')
            
            serializer = ChatDetailSerializer(chats, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API Tạo chat hình ảnh mới
class CreateImageChatAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            title = request.data.get('title', 'New Image Request')
            
            # Nếu bạn có trường is_image_chat trong model Chat
            chat = Chat.objects.create(
                user=user,
                title=title,
                is_image_chat=True  # Thêm trường này vào model Chat nếu muốn phân biệt loại chat
            )
            
            serializer = ChatDetailSerializer(chat)
            return Response(
                {"message": "Image chat created successfully", "chat": serializer.data},
                status=status.HTTP_201_CREATED
            )
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API Sinh hình ảnh và thêm vào chat turn
class GenerateImageAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            chat_id = request.data.get('chat_id')
            prompt_text = request.data.get('prompt_text')
            image_url = request.data.get('image_url')  # URL hình ảnh từ Unsplash hoặc API khác
            
            if not chat_id or not prompt_text or not image_url:
                return Response(
                    {"error": "Chat ID, prompt text and image URL are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                chat = Chat.objects.get(id=chat_id, user=user)
                
                # Tạo chat turn mới
                last_turn = ChatTurn.objects.filter(chat=chat).order_by('-turn_number').first()
                turn_number = (last_turn.turn_number + 1) if last_turn else 1
                chat_turn = ChatTurn.objects.create(chat=chat, turn_number=turn_number)
                
                # Thêm tin nhắn người dùng
                user_message = ChatbotMessage.objects.create(
                    chat_turn=chat_turn,
                    sender='user',
                    message_text=prompt_text
                )
                
                # Thêm phản hồi từ server với hình ảnh
                server_message = ChatbotMessage.objects.create(
                    chat_turn=chat_turn,
                    sender='server',
                    message_text=f"Generated image for: {prompt_text}"
                )
                
                # Lưu hình ảnh
                image = Image.objects.create(
                    chat_turn=chat_turn,
                    sender='server',
                    image_url=image_url,
                    prompt_text=prompt_text
                )
                
                # Trả về thông tin đầy đủ về chat turn
                serializer = ChatTurnSerializer(chat_turn)
                return Response(
                    {
                        "message": "Image generated successfully",
                        "chat_turn": serializer.data,
                        "image": ImageSerializer(image).data
                    },
                    status=status.HTTP_201_CREATED
                )
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API Lấy hình ảnh trong một chat
class GetChatImagesAPIView(APIView):
    def get(self, request, chat_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            try:
                # Kiểm tra quyền truy cập
                chat = Chat.objects.get(id=chat_id, user=user)
                
                # Lấy tất cả hình ảnh trong chat
                images = Image.objects.filter(chat_turn__chat=chat).order_by('chat_turn__turn_number')
                
                serializer = ImageSerializer(images, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)












# API Lấy lịch sử chat
class GetChatHistoryAPIView(APIView):
    def get(self, request, chat_id=None):
        # Xác thực thủ công
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            # Nếu chat_id được cung cấp
            if chat_id:
                try:
                    # Kiểm tra quyền truy cập
                    chat = Chat.objects.get(id=chat_id, user=user)
                    # Prefetch các chat turn, message và image
                    chat = Chat.objects.prefetch_related(
                        Prefetch(
                            'chatturns',
                            queryset=ChatTurn.objects.order_by('turn_number').prefetch_related(
                                'chatbotmessages', 'images'
                            )
                        )
                    ).get(id=chat_id)
                    serializer = ChatDetailSerializer(chat, context={'detailed': True})
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except Chat.DoesNotExist:
                    return Response(
                        {"error": "Chat not found or unauthorized"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            # Nếu không có chat_id, trả về danh sách các chat của user
            else:
                chats = Chat.objects.filter(user=user).order_by('-created_at')
                serializer = ChatDetailSerializer(chats, many=True, context={'detailed': False})
                return Response(serializer.data, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API Lấy chi tiết của một chat turn
class GetChatTurnAPIView(APIView):
    def get(self, request, turn_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            try:
                chat_turn = ChatTurn.objects.select_related('chat').get(id=turn_id, chat__user=user)
                chat_turn = ChatTurn.objects.prefetch_related('chatbotmessages', 'images').get(id=turn_id)
                serializer = ChatTurnSerializer(chat_turn)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ChatTurn.DoesNotExist:
                return Response({"error": "Chat turn not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API thêm phản hồi từ server
class AddServerResponseAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            chat_turn_id = request.data.get('chat_turn_id')
            message_text = request.data.get('message_text')
            image_url = request.data.get('image_url', None)
            if not chat_turn_id or not message_text:
                return Response(
                    {"error": "Chat turn ID and message text are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                chat_turn = ChatTurn.objects.select_related('chat').get(id=chat_turn_id, chat__user=user)
                server_message = ChatbotMessage.objects.create(
                    chat_turn=chat_turn,
                    sender='server',
                    message_text=message_text
                )
                if image_url:
                    Image.objects.create(
                        chat_turn=chat_turn,
                        sender='server',
                        image_url=image_url,
                        prompt_text=message_text
                    )
                serializer = ChatbotMessageSerializer(server_message)
                return Response(
                    {"message": "Server response added successfully", "response": serializer.data},
                    status=status.HTTP_201_CREATED
                )
            except ChatTurn.DoesNotExist:
                return Response({"error": "Chat turn not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API danh sách các chat của user
class ListUserChatsAPIView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            chats = Chat.objects.filter(user=user, is_image_chat=False).order_by('-created_at')
            serializer = ChatDetailSerializer(chats, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
class EditChatAPIView(APIView):
    def post(self, request, chat_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            try:
                chat = Chat.objects.get(id=chat_id, user=user)
                title = request.data.get('title')
                if not title:
                    return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)
                chat.title = title
                chat.save()
                serializer = ChatDetailSerializer(chat)
                return Response(
                    {"message": "Chat updated successfully", "chat": serializer.data},
                    status=status.HTTP_200_OK
                )
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
# API tạo chat mới
class CreateChatAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            title = request.data.get('title', 'New Chat')
            chat = Chat.objects.create(user=user, title=title)
            serializer = ChatDetailSerializer(chat)
            return Response(
                {"message": "Chat created successfully", "chat": serializer.data},
                status=status.HTTP_201_CREATED
            )
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API thêm chat turn mới
class AddChatTurnAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            chat_id = request.data.get('chat_id')
            message_text = request.data.get('message_text')
            image_url = request.data.get('image_url', None)
            try:
                chat = Chat.objects.get(id=chat_id, user=user)
                last_turn = ChatTurn.objects.filter(chat=chat).order_by('-turn_number').first()
                turn_number = (last_turn.turn_number + 1) if last_turn else 1
                chat_turn = ChatTurn.objects.create(chat=chat, turn_number=turn_number)
                ChatbotMessage.objects.create(
                    chat_turn=chat_turn,
                    sender='user',
                    message_text=message_text
                )
                if image_url:
                    Image.objects.create(
                        chat_turn=chat_turn,
                        sender='user',
                        image_url=image_url,
                        prompt_text=message_text
                    )
                serializer = ChatTurnSerializer(chat_turn)
                return Response(
                    {"message": "Chat turn added successfully", "chat_turn": serializer.data},
                    status=status.HTTP_201_CREATED
                )
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API xóa chat
class DeleteChatAPIView(APIView):
    def delete(self, request, chat_id):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            try:
                chat = Chat.objects.get(id=chat_id, user=user)
                chat.delete()
                return Response({"message": "Chat deleted successfully"}, status=status.HTTP_200_OK)
            except Chat.DoesNotExist:
                return Response({"error": "Chat not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API đăng ký user
class ClientRegisterUserAPIView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            password = serializer.validated_data.get('password_hash')
            serializer.validated_data['password_hash'] = make_password(password)
            serializer.save()
            return Response(
                {"message": "Đăng ký thành công!", "user": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# API cập nhật tên người dùng
class ClientUpdateUserNameAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            name = request.data.get('name')
            if not name:
                return Response({"detail": "Tên người dùng không được cung cấp"}, status=status.HTTP_400_BAD_REQUEST)
            user.name = name
            user.save()
            serializer = UserSerializer(user)
            return Response(
                {"message": "Cập nhật tên người dùng thành công!", "user": serializer.data},
                status=status.HTTP_200_OK
            )
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API đăng nhập
class ClientLoginUserAPIView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password_hash')
        user = User.objects.filter(email=email).first()
        if user and check_password(password, user.password_hash):
            payload = {
                "user_id": user.id,
                "exp": datetime.now(timezone.utc) + timedelta(hours=2),
                "iat": datetime.now(timezone.utc)
            }
            access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
            serializer = UserSerializer(user)
            return Response(
                {"access_token": access_token, "user_info": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

# API cấp lại mật khẩu qua email
class ClientResetPasswordAPIView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            print(f"[Reset Password] Looking for user with email: {email}")
            user = User.objects.get(email=email)
            new_password = get_random_string(length=12)
            subject = "Your New Password"
            message = f"""
Hello {user.name},

You have requested to reset your password. Here is your new password:

{new_password}

For security reasons, please change this password immediately after logging in.

If you did not request this password reset, please contact us immediately.

Best regards,
Your Application Team
            """

            try:
                print(f"[Reset Password] Creating email message for: {email}")
                print(f"[Reset Password] From email: {settings.DEFAULT_FROM_EMAIL}")
                print(f"[Reset Password] Subject: {subject}")
                
                email_message = EmailMessage(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                )
                
                # Add headers to prevent spam classification
                email_message.headers = {
                    'Reply-To': settings.DEFAULT_FROM_EMAIL,
                    'X-Priority': '1',  # Urgent
                }
                
                print("[Reset Password] Attempting to send email...")
                result = email_message.send(fail_silently=False)
                print(f"[Reset Password] Email send result: {result}")
                
                # Update password only if email was sent (result should be 1)
                if result == 1:
                    user.password_hash = make_password(new_password)
                    user.save()
                    print(f"[Reset Password] Password updated successfully for user: {user.email}")
                    return Response(
                        {
                            'message': 'New password has been sent to your email!',
                            'email_sent': True,
                            'recipient': email
                        }, 
                        status=status.HTTP_200_OK
                    )
                else:
                    print(f"[Reset Password] Email sending failed with result: {result}")
                    return Response(
                        {
                            'error': 'Failed to send email. Please try again later.',
                            'detail': f'Email send result: {result}'
                        }, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
            except Exception as e:
                print(f"[Reset Password] Email sending failed with error: {str(e)}")
                print(f"[Reset Password] Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}")
                print(f"[Reset Password] Using TLS: {settings.EMAIL_USE_TLS}")
                return Response(
                    {
                        'error': 'Failed to send email. Please try again later.',
                        'detail': str(e)
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except User.DoesNotExist:
            print(f"[Reset Password] No user found with email: {email}")
            return Response(
                {'error': 'No account found with this email address'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"[Reset Password] Password reset failed with error: {str(e)}")
            return Response(
                {
                    'error': 'An unexpected error occurred. Please try again later.',
                    'detail': str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# API xem thông tin người dùng
class ClientViewUserInfoAPIView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = UserSerializer(user)
            return Response(
                {"name": serializer.data['name'], "email": serializer.data['email']},
                status=status.HTTP_200_OK
            )
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

# API đổi mật khẩu
class ClientChangePasswordAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if not user_id:
                return Response({"detail": "Invalid token structure"}, status=status.HTTP_401_UNAUTHORIZED)
            user = User.objects.filter(id=user_id).first()
            if not user:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            old_password = request.data.get("old_password")
            new_password = request.data.get("new_password")
            if not old_password or not new_password:
                return Response({"error": "Vui lòng nhập đầy đủ thông tin"}, status=status.HTTP_400_BAD_REQUEST)
            if not check_password(old_password, user.password_hash):
                return Response({"error": "Mật khẩu cũ không chính xác"}, status=status.HTTP_400_BAD_REQUEST)
            user.password_hash = make_password(new_password)
            user.save()
            return Response({"message": "Đổi mật khẩu thành công!"}, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"detail": "Token has expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
