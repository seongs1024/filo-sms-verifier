import * as PostalMime from "postal-mime";

export default {
  async email(message, env, ctx) {
    const from = message.from;

    console.log("from:", from);

    // Check if from is not null and matches the pattern: numeric@domain
    if (from) {
      const emailPattern = /^(\d+)@\w.+$/;
      const match = from.match(emailPattern);

      if (match) {
        // Extract the numeric part (e.g., "821000000000")
        const key = match[1];

        const parser = new PostalMime.default();
        const rawEmail = new Response(message.raw);
        const email = await parser.parse(await rawEmail.arrayBuffer());

        console.log("email text:", email.text);

        if (email.text) {
          try {
            // Decode the base64 message (first line only)
            let firstLine = email.text.split("\n")[0].trim();
            console.log("First line of email:", firstLine);
            console.log("First line length:", firstLine.length);

            // Clean the string - remove any non-base64 characters except padding
            // This handles cases where there might be extra spaces, invisible characters, etc.
            firstLine = firstLine.replace(/[^A-Za-z0-9+/=]/g, "");

            const decodedText = decodeFrom256(firstLine);

            console.log("Decoded text:", decodedText);

            const jsonMessage = {
              ...JSON.parse(decodedText),
              phoneNumber: key,
            };

            // Save decoded text to KV with 60 second TTL
            await env.SMS_VERIFIER_KV.put(
              jsonMessage.id,
              JSON.stringify(jsonMessage),
              {
                expirationTtl: 60,
              },
            );

            // Accept the email
            console.log(
              `Saved decoded email from ${from} to KV with key: ${key} value: ${decodedText}`,
            );
          } catch (error) {
            console.error("Failed to decode or save email:", error);
          }
        }

        return;
      }
    }
  },
} satisfies ExportedHandler<Env>;

// Decode message from base64 with padding
function decodeFrom256(encodedMessage: string): string {
  try {
    console.log("Encoded message:", encodedMessage);
    console.log("Encoded message length:", encodedMessage.length);

    // Check if the string is exactly 256 characters (as per encodeTo256 function)
    if (encodedMessage.length !== 256) {
      console.warn(`Expected 256 characters, got ${encodedMessage.length}`);
    }

    // Remove padding ('=' characters) from the end
    const cleanBase64 = encodedMessage.replace(/=+$/, "");
    console.log("After removing padding:", cleanBase64);
    console.log("Clean base64 length:", cleanBase64.length);

    // Validate base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*$/;
    if (!base64Regex.test(cleanBase64)) {
      console.error("Invalid characters found in base64 string");
      // Try to extract only valid base64 characters
      const extractedBase64 =
        cleanBase64.match(/[A-Za-z0-9+/]/g)?.join("") || "";
      console.log("Extracted valid base64:", extractedBase64);
      throw new Error("Invalid base64 characters detected");
    }

    // Decode base64
    const binaryString = atob(cleanBase64);

    // Convert to string
    const decoder = new TextDecoder();
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return decoder.decode(bytes);
  } catch (error) {
    console.error("Decoding failed:", error);
    throw error;
  }
}
