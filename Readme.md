## Publish

1.  We need release version base on master and tag like: v0.1.0
2.  In github workflow, will rewrite package.json some fields.

        name | build.appId: will change to milvus-cpu-launcher or milvus-gpu-launcher
        version: base on your release tag, if your tag is v0.1.0 then your version is  0.1.0
