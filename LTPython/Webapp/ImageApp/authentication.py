from rest_framework_simplejwt.authentication import JWTAuthentication

class CustomJWTAuthentication(JWTAuthentication):
    pass  # Giữ nguyên, không cần ghi đè authenticate()
