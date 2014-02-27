#!/usr/bin/env sh

repo=thlorenz/browserify-markdown-editor

tags=$(curl -i https://api.github.com/repos/${repo}/git/refs | grep tags)
#| sed -e 's.\"ref\": \"refs/tags/..')

for tag in $tags
do
  echo $tag
done
