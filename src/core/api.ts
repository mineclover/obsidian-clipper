import { Property, Template } from "types/types";
import { collectPromptVariables } from "utils/interpreter";
import {
	generateFrontmatter,
	saveToObsidian,
} from "utils/obsidian-note-creator";
import {
	generalSettings,
	incrementStat,
	setLocalStorage,
} from "utils/storage-utils";
import {
	showError,
	waitForInterpreter,

} from "./popup";



let currentTemplate: Template | null = null;


// New function specifically for Obsidian operations
export async function handleClipWeb() {
	if (!currentTemplate) return;

	const vaultDropdown = document.getElementById(
		"vault-select"
	) as HTMLSelectElement;
	const noteContentField = document.getElementById(
		"note-content-field"
	) as HTMLTextAreaElement;
	const noteNameField = document.getElementById(
		"note-name-field"
	) as HTMLInputElement;
	const pathField = document.getElementById(
		"path-name-field"
	) as HTMLInputElement;
	const interpretBtn = document.getElementById(
		"interpret-btn"
	) as HTMLButtonElement;

	if (!vaultDropdown || !noteContentField) {
		showError(
			"Some required fields are missing. Please try reloading the extension."
		);
		return;
	}

	try {
		// Handle interpreter if needed
		if (
			generalSettings.interpreterEnabled &&
			interpretBtn &&
			collectPromptVariables(currentTemplate).length > 0
		) {
			if (interpretBtn.classList.contains("processing")) {
				await waitForInterpreter(interpretBtn);
			} else if (!interpretBtn.classList.contains("done")) {
				interpretBtn.click();
				await waitForInterpreter(interpretBtn);
			}
		}

		// Gather content
		const properties = Array.from(
			document.querySelectorAll(".metadata-property input")
		).map((input) => {
			const inputElement = input as HTMLInputElement;
			return {
				id:
					inputElement.dataset.id ||
					Date.now().toString() +
						Math.random().toString(36).slice(2, 11),
				name: inputElement.id,
				value:
					inputElement.type === "checkbox"
						? inputElement.checked
						: inputElement.value,
			};
		}) as Property[];

		const frontmatter = await generateFrontmatter(properties);
		const fileContent = frontmatter + noteContentField.value;

		// Save to Obsidian
		const selectedVault = currentTemplate.vault || vaultDropdown.value;
	
		const noteName =  noteNameField?.value ?? "";
		const path =  pathField?.value ?? "";

	

		return {
			fileContent,
			noteName,
			path ,
			selectedVault,
			behavior: currentTemplate.behavior
		}

		
	} catch (error) {
		console.error("Error in handleClipObsidian:", error);
		showError("failedToSaveFile");
		// throw error;
		return {
			fileContent :  noteContentField.value ?? "Error in handleClipWeb",
			noteName : noteNameField?.value ?? "Error in handleClipWeb",
			path : pathField?.value ?? "Error in handleClipWeb",
			selectedVault : vaultDropdown.value ?? "Error in handleClipWeb",
			behavior: currentTemplate?.behavior ?? "Error in handleClipWeb"
		}
	}
}


export function setupWindowListeners() {
	window.addEventListener("message", async (event) => {
		if (event.data.action === "clip") {
			const result = await handleClipWeb();
			window.postMessage({ action: "clipResult", result }, "*");
		}
	});
}