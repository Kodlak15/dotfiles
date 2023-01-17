import os
from os.path import join

current_directory = os.getcwd()
folder_name = test
full_path = join(current_directory, folder_name)
print(full_path)