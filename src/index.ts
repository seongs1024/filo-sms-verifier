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
          // Save to KV with 60 second TTL
          await env.sms_verifier.put(key, email.text, {
            expirationTtl: 60,
          });

          // Accept the email
          console.log(
            `Saved email from ${from} to KV with key: ${key} value: ${email.text}`,
          );
        }

        return;
      }
    }
  },
} satisfies ExportedHandler<Env>;
