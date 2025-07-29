/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async email(message, env, ctx) {
		const allowList = ['friend@example.com', 'coworker@example.com'];
		if (allowList.indexOf(message.headers.get('from')) == -1) {
			message.setReject('Address not allowed');
		} else {
			await message.forward('inbox@corp');
		}
	},
} satisfies ExportedHandler<Env>;
