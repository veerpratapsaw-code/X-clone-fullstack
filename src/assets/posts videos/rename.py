import os

# 👉 Put your folder path here
folder_path = r"C:\Users\sanjay\Videos\motivational video"
folder_path2 = r"C:\Users\sanjay\Videos\motivational videos"

files = [f for f in os.listdir(folder_path) if f.endswith(".mp4")]

# Optional: sort files alphabetically before renaming
files.sort()

for index, filename in enumerate(files, start=1):
    old_path = os.path.join(folder_path, filename)
    new_name = f"{index}.mp4"
    new_path = os.path.join(folder_path2, new_name)

    os.rename(old_path, new_path)

print("All files renamed successfully!")
