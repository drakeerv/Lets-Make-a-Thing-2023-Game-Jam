# You can optimize files manually using these tools
# https://optivorbis.github.io/OptiVorbis/
# https://prepack.io/repl.html
# https://zz85.github.io/glsl-optimizer/
# https://ctrl-alt-test.fr/minifier/
# https://ezgif.com/optiwebp/
# https://ezgif.com/optimize/

import os
import zipfile
import threading

ONLINE = True
if ONLINE:
    import requests
else:
    import rjsmin
import minify_html
import rcssmin

LOCK = threading.Lock()


def minimize_js(js: bytes) -> bytes:
    # toptal is unbeatable at minifying js
    if ONLINE:
        return requests.post(
            "https://www.toptal.com/developers/javascript-minifier/api/raw",
            data={"input": js.decode()},
        ).text.encode()
    return rjsmin.jsmin(js)


def minimize_css(css: bytes) -> bytes:
    # toptal is pretty much the same as rcssmin so we'll use that to save requests
    return rcssmin.cssmin(css)


def minimize_html(html: bytes) -> bytes:
    # for some reason toptal sucks at minifying html
    return minify_html.minify(
        html.decode(),
        minify_css=True,
        minify_js=True,
        remove_bangs=True,
        keep_html_and_head_opening_tags=True,
        do_not_minify_doctype=True,
    ).encode()


def add_file_thread(file: str, ziph: zipfile.ZipFile):
    if os.path.isdir(file):
        zipdir(file, ziph)
    else:
        if file.lower().endswith(tuple(MINIFY.keys())):
            with open(file, "rb") as f:
                minified_data = MINIFY[os.path.splitext(file.lower())[1]](f.read())

                LOCK.acquire()
                ziph.writestr(file, minified_data)
                LOCK.release()
        else:
            LOCK.acquire()
            ziph.write(file)
            LOCK.release()


MINIFY = {".js": minimize_js, ".css": minimize_css, ".html": minimize_html}

BLOCKLIST = [
    "package.py",
    "requirements.txt",
    "build.zip",
    "sources",
    "build",
    "assets/filter/frag.glsl",
    "assets/filter/vert.glsl",
    ".git",
    ".gitattributes",
    ".gitignore",
    "readme.md",
    "LICENSE"
]

BUILD_FILE = "build/build.zip"

threads = []


def zipdir(path: str, ziph: zipfile.ZipFile):
    for file in os.listdir(path):
        file = os.path.normpath(os.path.join(path, file)).replace("\\", "/")

        if file in BLOCKLIST:
            LOCK.acquire()
            print("Skipping " + file)
            LOCK.release()
            continue

        LOCK.acquire()
        print("Adding " + file)
        LOCK.release()

        thread = threading.Thread(target=add_file_thread, args=(file, ziph))
        thread.start()
        threads.append(thread)


def getSizeOfDir(path: str):
    size = 0
    for path, _, files in os.walk(path):
        for f in files:
            fp = os.path.join(path, f)
            size += os.path.getsize(fp)
    return size


if __name__ == "__main__":
    if not os.path.exists("build"):
        os.mkdir("build")

    zipf = zipfile.ZipFile(BUILD_FILE, "w", zipfile.ZIP_DEFLATED, True, 9)
    zipdir("./", zipf)

    for thread in threads:
        thread.join()

    zipf.close()

    print("=" * 20)
    print("Build complete")
    print(
        "Build size zipped: "
        + str(round(os.path.getsize(BUILD_FILE) / 1000000, 3))
        + " mb"
    )
    print("Project size: " + str(round(getSizeOfDir(".") / 1000000, 3)) + " mb")
