import os
from os.path import join

def find_rg(path: str, destination: str) -> None:
    pattern = ".rg."
    files_moved = 0

    for filename in os.listdir(path):
        if pattern in filename:
            source = join(path, filename)
            new_filename = join(destination, filename)
            os.rename(source, destination)
            files_moved += 1

    print(f"Finished! {files_moved} files were moved")