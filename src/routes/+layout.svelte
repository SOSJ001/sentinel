<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Solana Forensics Monitor</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
	{@render children?.()}
</div>
