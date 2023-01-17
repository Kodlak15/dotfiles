import os
from os.path import join
import json
from typing import Union, Tuple

def create_destination_folders(destination_directory: str) -> Tuple[str]:
    images = join(destination_directory, "images")
    if not "images" in os.listdir(destination_directory):
        os.mkdir(images)

    videos = join(destination_directory, "videos")
    if not "videos" in os.listdir(destination_directory):
        os.mkdir(videos)

    spreadsheets = join(destination_directory, "spreadsheets")
    if not "spreadsheets" in os.listdir(destination_directory):
        os.mkdir(spreadsheets)

    word_docs = join(destination_directory, "word_docs")
    if not "word_docs" in os.listdir(destination_directory):
        os.mkdir(word_docs)

    pdfs = join(destination_directory, "pdfs")
    if not "pdfs" in os.listdir(destination_directory):
        os.mkdir(pdfs)

    return images, videos, spreadsheets, word_docs, pdfs

def get_destination_folder(ext: str) -> Union[str, None]:
    if ext in folder_map["images"]:
        return images
    elif ext in folder_map["videos"]:
        return videos
    elif ext in folder_map["spreadsheets"]:
        return spreadsheets
    elif ext in folder_map["word_docs"]:
        return word_docs
    elif ext in folder_map["pdfs"]:
        return pdfs
    else:
        return None

def move_files(source_dir: str) -> int:
    files_moved = 0
    for filename in os.listdir(source_dir):
        ext = filename.split('.')[-1]
        destination_folder = get_destination_folder(ext)

        print(destination_folder)
        print(ext)
        print('-' * 50)

        if not destination_folder:
            continue
        else:
            source = join(source_dir, filename)
            destination = join(destination_folder, filename)
            os.rename(source, destination)
            files_moved += 1

    return files_moved

if __name__ == "__main__":
    with open("folder_map.json", 'r') as f:
        folder_map = json.load(f)

    with open("source_directories.txt", 'r') as f:
        source_directories = f.readlines()

    with open("destination_directory.txt", 'r') as f:
        destination_directory = f.readline()

    images, videos, spreadsheets, word_docs, pdfs = create_destination_folders(destination_directory)

    files_moved = 0
    for source_dir in source_directories:
        files_moved += move_files(source_dir)

    print(f"Finished! {files_moved} files were moved.")