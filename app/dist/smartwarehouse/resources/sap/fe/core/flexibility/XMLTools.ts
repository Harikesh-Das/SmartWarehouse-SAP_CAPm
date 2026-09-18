/**
 * Traverses a DOM element and adds generated ID properties to nodes representing controls that are missing IDs.
 * Controls are identified by local names starting with an uppercase letter.
 * @param element The root DOM element to traverse
 * @param prefix Optional prefix for generated IDs
 * @returns The number of IDs that were generated and added
 */
export function addGeneratedIdsToControls(element: Element, prefix = "generatedId"): number {
	let idCounter = 0;
	const generatedIds = new Set<string>();

	/**
	 * Recursively traverses the DOM tree and processes each element.
	 * @param node The current element being processed
	 */
	function traverse(node: Element): void {
		// Check if this is a control (local name starts with uppercase) and missing an ID
		if (isControl(node) && !node.hasAttribute("id")) {
			const generatedId = generateUniqueId(prefix, generatedIds);
			node.setAttribute("id", generatedId);
			generatedIds.add(generatedId);
			idCounter++;
		}

		// Recursively process all child elements
		for (let i = 0; i < node.children.length; i++) {
			traverse(node.children[i]);
		}
	}

	/**
	 * Determines if an element represents a UI5 control based on its local name.
	 * @param controlElement The element to check
	 * @returns True if the element represents a control
	 */
	function isControl(controlElement: Element): boolean {
		const localName = controlElement.localName ?? controlElement.tagName.toLowerCase();
		return localName.length > 0 && localName.charAt(0) === localName.charAt(0).toUpperCase();
	}

	/**
	 * Generates a unique ID that doesn't conflict with existing IDs.
	 * @param basePrefix The base prefix for the ID
	 * @param existingIds Set of already generated IDs
	 * @returns A unique ID string
	 */
	function generateUniqueId(basePrefix: string, existingIds: Set<string>): string {
		let counter = 1;
		let candidateId = `${basePrefix}_${counter}`;

		while (existingIds.has(candidateId) || document.getElementById(candidateId)) {
			counter++;
			candidateId = `${basePrefix}_${counter}`;
		}

		return candidateId;
	}

	traverse(element);
	return idCounter;
}
