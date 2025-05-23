import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Webapp.settings')
django.setup()

def test_email():
    try:
        print("Starting email test...")
        print(f"Email settings:")
        print(f"HOST: {settings.EMAIL_HOST}")
        print(f"PORT: {settings.EMAIL_PORT}")
        print(f"TLS: {settings.EMAIL_USE_TLS}")
        print(f"FROM: {settings.DEFAULT_FROM_EMAIL}")
        
        subject = 'Test Email from Django'
        message = 'This is a test email from Django application.'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = ['truc95520@gmail.com']
        
        print("\nAttempting to send email...")
        result = send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )
        
        print(f"\nEmail send result: {result}")
        if result == 1:
            print("Email sent successfully!")
        else:
            print("Email sending failed!")
            
    except Exception as e:
        print(f"\nError occurred: {str(e)}")
        print(f"Error type: {type(e)}")

if __name__ == '__main__':
    test_email() 