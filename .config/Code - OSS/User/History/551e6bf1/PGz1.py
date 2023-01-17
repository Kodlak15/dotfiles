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
    with open("source_folders.txt", 'r') as f:
        source_folders = f.readlines()

    with open("destination_folders.txt", 'r') as f:
        destination_folder = f.readlines()[0]

    for source_folder in source_folder:
        move_rg(source_folder, destination_folder)