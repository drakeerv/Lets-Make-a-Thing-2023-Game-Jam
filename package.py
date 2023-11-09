# zip up all files in the current directory except block list

import os
import zipfile
import rjsmin
import minify_html
import rcssmin

BLOCKLIST = [
    "package.py",
    "build.zip",
    "sources",
    "build",
    "assets/filter/frag.glsl",
    "assets/filter/vert.glsl",
    ".git",
    ".gitattributes",
    ".gitignore",
    "README.md",
    "LICENSE"
]


def zipdir(path: str, ziph: zipfile.ZipFile):
    for file in os.listdir(path):
        file = os.path.normpath(os.path.join(path, file)).replace("\\", "/")

        if file in BLOCKLIST:
            print("Skipping " + file)
            continue

        print("Adding " + file)
        if os.path.isdir(file):
            zipdir(file, ziph)
        else:
            if file.endswith(".js"):
                with open(file, "rb") as f:
                    ziph.writestr(file,
                                  rjsmin.jsmin(f.read()))
            elif file.endswith(".html"):
                with open(file, "rb") as f:
                    ziph.writestr(file, minify_html.minify(f.read().decode("utf-8"), minify_css=True,
                                  minify_js=True, remove_bangs=True, keep_html_and_head_opening_tags=True, do_not_minify_doctype=True))
            elif file.endswith(".css"):
                with open(file, "rb") as f:
                    ziph.writestr(file,
                                  rcssmin.cssmin(f.read().decode("utf-8")))
            else:
                ziph.write(file)


if __name__ == "__main__":
    if not os.path.exists("build"):
        os.mkdir("build")
    zipf = zipfile.ZipFile("build/build.zip", "w",
                           zipfile.ZIP_DEFLATED, True, 9)
    zipdir("./", zipf)
    zipf.close()
