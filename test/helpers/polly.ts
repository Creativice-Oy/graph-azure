import { Buffer } from "buffer";
import { Har } from "har-format";
import { gunzipSync } from "zlib";

import NodeHttpAdapter from "@pollyjs/adapter-node-http";
import { Polly, PollyConfig } from "@pollyjs/core";
import FSPersister from "@pollyjs/persister-fs";

Polly.register(NodeHttpAdapter);

class SafeHeadersFSPersister extends FSPersister {
  constructor() {
    // We're forced to use arguments[0] here instead of an actual argument by
    // the @types/pollyjs__persister, which hasn't typed the Polly Persister's
    // constructor.
    super(arguments[0]);
  }

  public saveRecording(recordingId: number, data: Har) {
    data.log.entries.forEach(entry => {
      // Redact tokens, even though they expire
      entry.request.headers.forEach(header => {
        if (header.name === "authorization") {
          header.value = "Bearer [REDACTED]";
        }
      });

      let responseText = entry.response.content.text!;
      const contentEncoding = entry.response.headers.find(
        e => e.name === "content-encoding",
      );
      const transferEncoding = entry.response.headers.find(
        e => e.name === "transfer-encoding",
      );

      if (contentEncoding && contentEncoding.value === "gzip") {
        const chunkBuffers: Buffer[] = [];
        const hexChunks = JSON.parse(responseText) as string[];
        hexChunks.forEach(chunk => {
          const chunkBuffer = Buffer.from(chunk, "hex");
          chunkBuffers.push(chunkBuffer);
        });

        responseText = gunzipSync(Buffer.concat(chunkBuffers)).toString(
          "utf-8",
        );

        // Remove encoding/chunking since content is now unzipped
        entry.response.headers = entry.response.headers.filter(
          e => e && e !== contentEncoding && e !== transferEncoding,
        );
        entry.response.content.text = responseText;
      }

      const responseJson = JSON.parse(responseText);

      if (entry.request.url.match(/login/) && entry.request.postData) {
        // Redact request body with secrets for authentication
        entry.request.postData.text = "[REDACTED]";

        // Redact authentication response token
        if (responseJson.access_token) {
          entry.response.content.text = JSON.stringify(
            {
              ...responseJson,
              access_token: "[REDACTED]",
            },
            null,
            0,
          );
        }
      }

      // Redact all cookie values
      entry.response.headers = entry.response.headers.map(e => {
        if (e.name === "set-cookie") {
          return { ...e, value: "[REDACTED]" };
        } else {
          return e;
        }
      });

      entry.response.cookies = entry.response.cookies.map(e => ({
        ...e,
        value: "[REDACTED]",
      }));
    });

    super.saveRecording(recordingId, data);
  }
}

export default function polly(
  recordingsDir: string,
  name: string,
  config: PollyConfig = {},
): Polly {
  return new Polly(name, {
    adapters: ["node-http"],
    persister: SafeHeadersFSPersister,
    persisterOptions: {
      SafeHeadersFSPersister: {
        recordingsDir: `${recordingsDir}/__recordings__`,
      },
    },
    matchRequestsBy: {
      headers: false,
      body: false,
    },
    ...config,
  });
}