import type BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import NotesBuildingBlock from "sap/fe/macros/notes/Notes.block";
import FlexibleColumnLayoutActionsBlock from "./fcl/FlexibleColumnLayoutActions.block";
import FormBlock from "./form/Form.block";
import FormContainerBlock from "./form/FormContainer.block";
import CustomFragmentBlock from "./fpm/CustomFragment.block";
import ActionCommandBlock from "./internal/ActionCommand.block";
import HeaderDataPointBlock from "./internal/HeaderDataPoint.block";

const buildingBlocks: (typeof BuildingBlockTemplatingBase)[] = [
	ActionCommandBlock,
	CustomFragmentBlock,
	HeaderDataPointBlock,
	FlexibleColumnLayoutActionsBlock,
	FormBlock,
	FormContainerBlock,
	NotesBuildingBlock
];

function registerAll(): void {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.register();
	}
}

//This is needed in for templating test utils
function unregisterAll(): void {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.unregister();
	}
}

// Adding Semantic Date Operators
SemanticDateOperators.addSemanticDateOperators();

//Always register when loaded for compatibility
registerAll();

export default {
	register: registerAll,
	unregister: unregisterAll
};
