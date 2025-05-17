// frontend/src/services/priceService.js

// --- Constants from your backend/src/services/priceCalculator.js ---
const BASE_COSTS = {
    180: 349.00,
    240: 499.00
};
const DESIGN_ADDON_COST = 50.00; // For AI or Own Photo, AI Draw

const MAX_PRINT_AREAS_SQIN = {
    "S": 448.5, "M": 480.0, "L": 525.0, "XL": 572.0
};

const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330;
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;
const UI_OUTER_PRINTABLE_PIXEL_AREA = UI_OUTER_PRINTABLE_PIXEL_WIDTH * UI_OUTER_PRINTABLE_PIXEL_HEIGHT;

const PRINTING_COSTS_BY_FRACTION = {
    "S": {"1/4": 56.06, "1/2": 112.13, "3/4": 168.19, "Full": 224.25},
    "M": {"1/4": 60.00, "1/2": 120.00, "3/4": 180.00, "Full": 240.00},
    "L": {"1/4": 65.63, "1/2": 131.25, "3/4": 196.88, "Full": 262.50},
    "XL": {"1/4": 71.50, "1/2": 143.00, "3/4": 214.50, "Full": 286.00}
};

const EMBROIDERY_TEXT_COST = 80.00;
const EMBROIDERY_DESIGN_LIBRARY_COST = 50.00;
// AI_DRAW_IMAGE_COST is implicitly covered by DESIGN_ADDON_COST in this structure
const LIBRARY_DESIGN_STICKER_COST_VALUE = 20.00; 
// --- End Constants ---

// --- Helper Functions from your backend/src/services/priceCalculator.js ---
function getDesignSourceEquivalent(customizationType) {
    if (!customizationType) return "PLAIN";
    if (customizationType === 'ai_text_image') return "AI";
    if (customizationType === 'uploaded_image' || customizationType === 'sticker') return "OWN PHOTO";
    if (customizationType === 'library_design') return "LIBRARY";
    if (customizationType === 'embroidery_text') return "EMBROIDERY_TEXT";
    if (customizationType === 'embroidery_design') return "EMBROIDERY_DESIGN";
    if (customizationType === 'ai_draw_image') return "AI_DRAW";
    return "OTHER_CUSTOM";
}
// --- End Helper Functions ---


// This is the main function OrderPreviewScreen will call
export function calculatePriceDetailsForUI(item) {
    // item: { productType, size, color, thickness, thicknessName, frontCustomization, backCustomization, quantity }
    // frontCustomization/backCustomization: { type, src, prompt, position, text, font, textColor, name (for library), imageId, filename }
    // position for printable: { x, y, width, height } (in UI pixels)

    console.log("PRICE_SERVICE_UI: Calculating for item:", JSON.parse(JSON.stringify(item)));

    const details = {
        baseShirtCost: 0,
        designAddonCost: 0,
        embroideryCostFront: 0,
        embroideryCostBack: 0,
        printingCostFront: 0,
        printingCostBack: 0,
        libraryDesignStickerCost: 0,
        totalUnitPrice: 0,
        errors: [],
        debug: [] // For collecting debug messages during calculation
    };

    details.debug.push(`UI CALC: Size ${item.size}, Thickness ${item.thickness}`);

    // 1. Base Shirt Cost
    if (!item.thickness || !BASE_COSTS[item.thickness.toString()]) {
        details.errors.push(`Item thickness (GSM) '${item.thickness}' is invalid or not set.`);
        details.debug.push(`UI CALC ERROR: Invalid GSM: ${item.thickness}.`);
        return { // Return a structure that includes an error state and zero price
            totalUnitPrice: 0,
            priceBreakdownForDisplay: { ...details, baseShirtCost: 0 }, // Include what was calculated
            errors: details.errors
        };
    }
    const gsmKey = item.thickness.toString();
    details.baseShirtCost = BASE_COSTS[gsmKey];
    details.debug.push(`UI CALC: Base GSM cost for ${gsmKey}: ${details.baseShirtCost.toFixed(2)}`);

    let effectiveBaseForAddons = details.baseShirtCost; // Start with base shirt cost

    // 2. Design Add-on Cost (Flat fee for AI text-to-image, own photo, or AI draw)
    const frontDesignEq = getDesignSourceEquivalent(item.frontCustomization?.type);
    const backDesignEq = getDesignSourceEquivalent(item.backCustomization?.type);

    let mainDesignAddonApplied = false;
    if (frontDesignEq === "AI" || frontDesignEq === "OWN PHOTO" || frontDesignEq === "AI_DRAW") {
        mainDesignAddonApplied = true;
    }
    if (!mainDesignAddonApplied && (backDesignEq === "AI" || backDesignEq === "OWN PHOTO" || backDesignEq === "AI_DRAW")) {
        mainDesignAddonApplied = true;
    }

    if (mainDesignAddonApplied) {
        details.designAddonCost = DESIGN_ADDON_COST;
        details.debug.push(`UI CALC: Applied AI/Own Photo/AI Draw flat addon: ${details.designAddonCost.toFixed(2)}.`);
    }

    // 3. Embroidery Cost Calculation
    const calculateEmbroideryCost = (customization, sideName) => {
        if (!customization || !customization.type) return 0;
        const designEq = getDesignSourceEquivalent(customization.type);
        if (designEq === "EMBROIDERY_TEXT") {
            details.debug.push(`UI CALC: ${sideName} Embroidery Text cost: ${EMBROIDERY_TEXT_COST.toFixed(2)}`);
            return EMBROIDERY_TEXT_COST;
        }
        if (designEq === "EMBROIDERY_DESIGN") {
            details.debug.push(`UI CALC: ${sideName} Embroidery Design Library cost: ${EMBROIDERY_DESIGN_LIBRARY_COST.toFixed(2)}`);
            return EMBROIDERY_DESIGN_LIBRARY_COST;
        }
        return 0;
    };
    details.embroideryCostFront = calculateEmbroideryCost(item.frontCustomization, "Front");
    details.embroideryCostBack = calculateEmbroideryCost(item.backCustomization, "Back");

    

    // 4. Area-Based Printing Cost Calculation
    const calculateSidePrintingCost = (customization, tshirtSize, sideName) => {
        details.debug.push(`UI CALC (Print ${sideName}): Starting...`);
        if (!customization || !customization.type) return 0;

        const designEq = getDesignSourceEquivalent(customization.type);
        const IS_AREA_PRINTABLE = ["AI", "OWN PHOTO", "AI_DRAW", "LIBRARY"].includes(designEq);
        // Also exclude embroidery types from area printing costs if they somehow got here
        if (!IS_AREA_PRINTABLE || designEq === "EMBROIDERY_TEXT" || designEq === "EMBROIDERY_DESIGN") {
             details.debug.push(`UI CALC (Print ${sideName}): Type '${designEq}' not area printable. Cost 0.`);
            return 0;
        }
        // Special handling for library designs that might have a flat sticker cost instead of area-based
        if (designEq === "LIBRARY" && getDesignSourceEquivalent(customization.type) !== "EMBROIDERY_DESIGN" ) {
             // This cost is handled by libraryDesignStickerCost later. So, no area printing cost.
             details.debug.push(`UI CALC (Print ${sideName}): Library design type '${customization.name}' has flat sticker cost, not area. Print Cost 0.`);
             return 0;
        }

        if (!customization.position || typeof customization.position.width !== 'number' || typeof customization.position.height !== 'number' || customization.position.width <= 0 || customization.position.height <= 0) {
            details.errors.push(`${sideName} printing requires position data (width/height in UI pixels).`);
            details.debug.push(`UI CALC (Print ${sideName}): Invalid position data. Cost 0.`);
            return 0;
        }
        const { width: canvaPixelWidth, height: canvaPixelHeight } = customization.position;
        if (!tshirtSize || !MAX_PRINT_AREAS_SQIN[tshirtSize]) {
            details.errors.push(`Invalid T-shirt size ('${tshirtSize}') for ${sideName} print cost.`);
             details.debug.push(`UI CALC (Print ${sideName}): Invalid T-shirt size. Cost 0.`);
            return 0;
        }
        const maxRealSqInch = MAX_PRINT_AREAS_SQIN[tshirtSize];
        if (maxRealSqInch <=0) {details.errors.push(`Max print area for size '${tshirtSize}' is invalid.`); return 0;}

        const pixelsToSqInchFactor = UI_OUTER_PRINTABLE_PIXEL_AREA / maxRealSqInch;
         if (pixelsToSqInchFactor <= 0) { details.errors.push(`Pixel to Sq.Inch factor invalid.`); return 0;}

        let actualPrintSqIn = (canvaPixelWidth * canvaPixelHeight) / pixelsToSqInchFactor;
        actualPrintSqIn = Math.min(actualPrintSqIn, maxRealSqInch); // Cap at max
        if (actualPrintSqIn <= 0) { details.debug.push(`UI CALC (Print ${sideName}): Actual area <=0. Cost 0.`); return 0; }

        const coverageRatio = actualPrintSqIn / maxRealSqInch;
        let fraction = coverageRatio <= 0.25 ? "1/4" : coverageRatio <= 0.50 ? "1/2" : coverageRatio <= 0.75 ? "3/4" : "Full";
        
        if (PRINTING_COSTS_BY_FRACTION[tshirtSize] && PRINTING_COSTS_BY_FRACTION[tshirtSize][fraction]) {
            const cost = PRINTING_COSTS_BY_FRACTION[tshirtSize][fraction];
            details.debug.push(`UI CALC (Print ${sideName}): Size '${tshirtSize}', fraction '${fraction}', cost: ${cost.toFixed(2)}`);
            return cost;
        }
        details.errors.push(`No print cost for ${sideName}: size '${tshirtSize}', fraction '${fraction}'.`);
        return 0;
    };

    if (item.size && MAX_PRINT_AREAS_SQIN[item.size]) {
        details.printingCostFront = calculateSidePrintingCost(item.frontCustomization, item.size, "Front");
        details.printingCostBack = calculateSidePrintingCost(item.backCustomization, item.size, "Back");
    } else {
        details.errors.push(`T-shirt size '${item.size}' invalid for printing costs.`);
    }

    // 5. Specific cost for Design Library sticker (+₹20), only if not embroidery
    let calculatedLibraryDesignStickerCost = 0;
    const processLibrarySticker = (customization) => {
        if (customization && getDesignSourceEquivalent(customization.type) === "LIBRARY" && 
            getDesignSourceEquivalent(customization.type) !== "EMBROIDERY_DESIGN") {
            return LIBRARY_DESIGN_STICKER_COST_VALUE;
        }
        return 0;
    };
    
    const frontStickerCost = processLibrarySticker(item.frontCustomization);
    const backStickerCost = processLibrarySticker(item.backCustomization);

    calculatedLibraryDesignStickerCost = frontStickerCost;
    if (backStickerCost > 0) {
        // Avoid double charge if front already had the same library item src.
        // This simple check might not be perfect for all scenarios but covers basic same-image.
        if (!item.frontCustomization || !item.frontCustomization.src || 
            !item.backCustomization || !item.backCustomization.src ||
            item.frontCustomization.src !== item.backCustomization.src || 
            getDesignSourceEquivalent(item.frontCustomization.type) !== "LIBRARY") {
            calculatedLibraryDesignStickerCost += backStickerCost;
        }
    }
    details.libraryDesignStickerCost = calculatedLibraryDesignStickerCost;
    if (details.libraryDesignStickerCost > 0) {
         details.debug.push(`UI CALC: Library Design Sticker cost: ${details.libraryDesignStickerCost.toFixed(2)}`);
    }
    
    // Total Unit Price: Start with base, add design addon, then per-side costs.
    details.totalUnitPrice = details.baseShirtCost +
                             details.designAddonCost + // Flat fee if AI/Own Photo/AI Draw is used on EITHER side
                             details.embroideryCostFront +
                             details.embroideryCostBack +
                             details.printingCostFront +
                             details.printingCostBack +
                             details.libraryDesignStickerCost;

    details.debug.push(`UI CALC: Final Unit Price: ${details.totalUnitPrice.toFixed(2)}`);
     if (details.errors.length > 0) {
        console.warn("UI Price calculation encountered errors:", JSON.stringify(details.errors));
    }
    // console.log("UI Price Calculation Debug Log:", details.debug);


    // Structure to be returned to the UI component
    return {
        totalUnitPrice: parseFloat(details.totalUnitPrice.toFixed(2)),
        priceBreakdownForDisplay: { // This is what currentItem.priceBreakdown will store
            baseGSM: details.baseShirtCost,
            designAddon: details.designAddonCost,
            printFront: details.printingCostFront,
            printBack: details.printingCostBack,
            embroideryFront: details.embroideryCostFront, // Added for completeness
            embroideryBack: details.embroideryCostBack,   // Added for completeness
            librarySticker: details.libraryDesignStickerCost, // Added
            // Add other specific costs if needed for display
        },
        errors: details.errors
    };
    priceBreakdownForDisplay



}