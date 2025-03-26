import os
from decouple import config
print(config('DB_NAME'))
print(config('DB_USER'))
print(config('DB_PASSWORD'))
print(config('DB_HOST'))