import os
from os.path import join

def move_rg(source_folder: str, destination_folder: str) -> None:
    pattern = ".rg."
    files_moved = 0

    for filename in os.listdir(source_folder):
        if pattern in filename:
            source = join(source_folder, filename)
            destination = join(destination_folder, filename)
            os.rename(source, destination)
            files_moved += 1

    print(f"Finished! {files_moved} files were moved")

if __name__ == "__main__":
    source_folder = "home/cody/Desktop"
    destination_folder = "home/cody/Documents/real-geeks"

    print("Files in source folder")
    print(os.listdir(source_folder))
    print("Files in destination folder")
    print(os.listdir(destination_folder))

    move_rg(source_folder, destination_folder)
    print('-' * 50)

    print("Files in source folder")
    print(os.listdir(source_folder))
    print("Files in destination folder")
    print(os.listdir(destination_folder))