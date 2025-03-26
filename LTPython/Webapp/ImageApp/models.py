from django.db import models

class User(models.Model):
    id = models.AutoField(primary_key=True)  # Tự động tạo id
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "imageapp_user"  # Chỉ định bảng cơ sở dữ liệu

    @property
    def is_authenticated(self):
        return True  # Django yêu cầu thuộc tính này để xác thực user

class Chat(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_image_chat = models.BooleanField(default=False)
class ChatTurn(models.Model):
    id = models.AutoField(primary_key=True)
    # Đặt related_name cho phép truy cập ngược với tên "chatturns"
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='chatturns')
    turn_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class ChatbotMessage(models.Model):
    id = models.AutoField(primary_key=True)
    # Đặt related_name "chatbotmessages" để truy cập từ ChatTurn
    chat_turn = models.ForeignKey(ChatTurn, on_delete=models.CASCADE, related_name="chatbotmessages")
    sender = models.CharField(max_length=255)
    message_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Image(models.Model):
    id = models.AutoField(primary_key=True)
    # Đặt related_name "images" để truy cập từ ChatTurn
    chat_turn = models.ForeignKey(ChatTurn, on_delete=models.CASCADE, related_name="images")
    sender = models.CharField(max_length=255)
    prompt_text = models.TextField()
    image_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
