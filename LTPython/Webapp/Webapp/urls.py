from django.urls import path
from ImageApp.views.client_views import (
    ClientRegisterUserAPIView,
    ClientLoginUserAPIView,
    ClientResetPasswordAPIView,
    ClientViewUserInfoAPIView,
    ClientChangePasswordAPIView,
    ClientUpdateUserNameAPIView,
    CreateChatAPIView,
    AddChatTurnAPIView,
    DeleteChatAPIView,
    GetChatHistoryAPIView,
    GetChatTurnAPIView,
    AddServerResponseAPIView,
    ListUserChatsAPIView,
    EditChatAPIView,
    ListImageChatsAPIView,
    CreateImageChatAPIView,
    GenerateImageAPIView,
    GetChatImagesAPIView,
    UpdateNameImageChatAPIView,
    SaveGeneratedImageAPIView
)

urlpatterns = [

    #API FOR CLIENT
    path('api/register/', ClientRegisterUserAPIView.as_view(), name='client-register'),
    path('api/login/', ClientLoginUserAPIView.as_view(), name='client-login'),
    path('api/reset-password/', ClientResetPasswordAPIView.as_view(), name='reset-password'),
    path('api/view-user-info/', ClientViewUserInfoAPIView.as_view(), name='view-user-info'),
    path('api/change-password/', ClientChangePasswordAPIView.as_view(), name='change-password'),
    path('api/change-name/', ClientUpdateUserNameAPIView.as_view(), name='change-name'),



    #API FOR CHATBOT
    path('api/chats/create/', CreateChatAPIView.as_view(), name='create-chat'),
    path('api/chats/add-turn/', AddChatTurnAPIView.as_view(), name='add-chat-turn'),
    path('api/chats/delete/<int:chat_id>/', DeleteChatAPIView.as_view(), name='delete-chat'),
    path('api/chats/update/<int:chat_id>/', EditChatAPIView.as_view(), name='edit-chat'),

    # NEW CHAT ENDPOINTS
    path('api/chats/', ListUserChatsAPIView.as_view(), name='list-chats'),
    path('api/chats/<int:chat_id>/', GetChatHistoryAPIView.as_view(), name='get-chat-history'),
    path('api/chat-turns/<int:turn_id>/', GetChatTurnAPIView.as_view(), name='get-chat-turn'),
    path('api/chats/add-server-response/', AddServerResponseAPIView.as_view(), name='add-server-response'),



    #IMAGE ENDPOINTS
    path('api/image-chats/', ListImageChatsAPIView.as_view(), name='list_image_chats'),
    path('api/image-chats/create/', CreateImageChatAPIView.as_view(), name='create_image_chat'),
    path('api/image-chats/generate/', GenerateImageAPIView.as_view(), name='generate_image'),
    path('api/image-chats/<int:chat_id>/images/', GetChatImagesAPIView.as_view(), name='get_chat_images'),
    path('api/image-chats/update/<int:chat_id>/images/', UpdateNameImageChatAPIView.as_view(), name='edit_chat_images'),
    
    # NEW IMAGE ENDPOINT
    path('api/save-generated-image/', SaveGeneratedImageAPIView.as_view(), name='save_generated_image'),

]
