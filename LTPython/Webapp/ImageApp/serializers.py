from rest_framework import serializers
from ImageApp.models import Chat, ChatTurn, ChatbotMessage, Image, User

class UserSerializer(serializers.ModelSerializer):
    password_hash = serializers.CharField(min_length=6) # write_only=True thì sẽ ẩn password khi POST API

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password_hash', 'created_at']  # Đúng theo bảng SQL
        read_only_fields = ['created_at']

    def create(self, validated_data):
        user = User.objects.create(
            name=validated_data['name'],
            email=validated_data['email'],
            password_hash=validated_data['password_hash']  # Đổi 'password' thành 'password_hash'
        )
        return user

class ChatbotMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotMessage
        fields = ['id', 'sender', 'message_text', 'created_at']

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'sender', 'prompt_text', 'image_url', 'created_at']

class ChatTurnSerializer(serializers.ModelSerializer):
    # Đảm bảo tên trường không trùng với related_name, hoặc bỏ source nếu trùng
    chatbot_messages = ChatbotMessageSerializer(many=True, read_only=True, source='chatbotmessages')
    # Tên trường khác với related_name nên cần source
    images = ImageSerializer(many=True, read_only=True)  # Không cần source vì tên trường = related_name

    class Meta:
        model = ChatTurn
        fields = ['id', 'turn_number', 'created_at', 'chatbot_messages', 'images']

class ChatDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    chat_turns = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'user', 'title', 'created_at', 'chat_turns']

    def get_chat_turns(self, obj):
        # Sử dụng related_name 'chatturns' đã được định nghĩa trong model
        chat_turns = obj.chatturns.prefetch_related(
            'chatbotmessages',  # Sử dụng related_name từ model
            'images'            # Sử dụng related_name từ model
        ).order_by('turn_number')
        return ChatTurnSerializer(chat_turns, many=True).data