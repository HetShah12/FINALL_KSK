// backend/src/services/priceCalculator.js

const BASE_COSTS = {
    180: 349.00,
    240: 499.00
};
const DESIGN_ADDON_COST = 50.00; // For AI or Own Photo

const MAX_PRINT_AREAS_SQIN = { // Renamed to avoid conflict if also used for UI pixels
    "S": 448.5, "M": 480.0, "L": 525.0, "XL": 572.0
};

// UI Canvas dimensions to relate to real-world sq. inches
// These must match the outerPrintableArea in your Order_Preview_Screen.html / component
const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330;
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;
const UI_OUTER_PRINTABLE_PIXEL_AREA = UI_OUTER_PRINTABLE_PIXEL_WIDTH * UI_OUTER_PRINTABLE_PIXEL_HEIGHT;


const PRINTING_COSTS_BY_FRACTION = {
    "S": {"1/4": 56.06, "1/2": 112.13, "3/4": 168.19, "Full": 224.25},
    "M": {"1/4": 60.00, "1/2": 120.00, "3/4": 180.00, "Full": 240.00},
    "L": {"1/4": 65.63, "1/2": 131.25, "3/4": 196.88, "Full": 262.50},
    "XL": {"1/4": 71.50, "1/2": 143.00, "3/4": 214.50, "Full": 286.00}
};

// Embroidery costs (Example values, adjust as needed)
const EMBROIDERY_TEXT_COST = 80.00;
const EMBROIDERY_DESIGN_LIBRARY_COST = 50.00;
const AI_DRAW_IMAGE_COST = 50.00; // From Ai_Draw_To_Img_Screen.html


function getDesignSourceEquivalent(customizationType) {
    if (!customizationType) return "PLAIN";
    if (customizationType === 'ai_text_image') return "AI";
    if (customizationType === 'uploaded_image' || customizationType === 'sticker') return "OWN PHOTO"; // sticker treated like uploaded
    if (customizationType === 'library_design') return "LIBRARY";
    if (customizationType === 'embroidery_text') return "EMBROIDERY_TEXT";
    if (customizationType === 'embroidery_design') return "EMBROIDERY_DESIGN";
    if (customizationType === 'ai_draw_image') return "AI_DRAW";
    return "OTHER_CUSTOM"; // Generic category for other custom types
}


function calculatePriceDetails(item) {
    // item: { productType, size, color, thickness, thicknessName, frontCustomization, backCustomization, quantity }
    // frontCustomization/backCustomization: { type, src, prompt, position, text, font, textColor, name (for library) }
    // position for printable: { x, y, width, height } (in UI pixels relative to outerPrintableArea)

    const details = {
        baseShirtCost: 0,
        designAddonCost: 0, // General addon for AI/Own Photo base
        embroideryCostFront: 0,
        embroideryCostBack: 0,
        printingCostFront: 0,
        printingCostBack: 0,
        totalUnitPrice: 0,
        errors: [],
        debug: []
    };

    details.debug.push(`Calculating price for item: Size ${item.size}, Thickness ${item.thickness}`);

    // 1. Base Shirt Cost
    if (!item.thickness || !BASE_COSTS[item.thickness.toString()]) {
        details.errors.push(`Item thickness (GSM) '${item.thickness}' is invalid or not set. Base cost calculation failed.`);
        details.debug.push(`Invalid GSM: ${item.thickness}. Valid keys: ${Object.keys(BASE_COSTS)}`);
        // Do not proceed if base cost cannot be determined, or set a default/error state
        return details; // Early exit if critical info missing
    }
    const gsmKey = item.thickness.toString();
    details.baseShirtCost = BASE_COSTS[gsmKey];
    details.debug.push(`Base GSM cost for ${gsmKey}: ${details.baseShirtCost.toFixed(2)}`);

    let effectiveBaseForPrintingAndEmbroidery = details.baseShirtCost;

    // 2. Design Add-on Cost (Flat fee for using AI text-to-image, own photo, or AI draw)
    const frontDesignEq = getDesignSourceEquivalent(item.frontCustomization?.type);
    const backDesignEq = getDesignSourceEquivalent(item.backCustomization?.type);

    let aiOrOwnPhotoUsed = false;
    if (frontDesignEq === "AI" || frontDesignEq === "OWN PHOTO") aiOrOwnPhotoUsed = true;
    if (backDesignEq === "AI" || backDesignEq === "OWN PHOTO") aiOrOwnPhotoUsed = true;

    // Note: DESIGN_ADDON_COST for 'AI Text to Image' (+₹50), 'Upload Image' (+₹50) is handled here
    // AI Draw to Image is also +₹50, similar logic.
    if (aiOrOwnPhotoUsed || frontDesignEq === "AI_DRAW" || backDesignEq === "AI_DRAW") {
         // This covers the flat +50 for AI text-to-image, Upload Image, and AI Draw to Image
        details.designAddonCost = DESIGN_ADDON_COST;
        effectiveBaseForPrintingAndEmbroidery += details.designAddonCost;
        details.debug.push(`Applied AI/Own Photo/AI Draw flat addon: ${details.designAddonCost.toFixed(2)}. Effective base: ${effectiveBaseForPrintingAndEmbroidery.toFixed(2)}`);
    }

    // 3. Embroidery Cost Calculation (per side)
    const calculateEmbroideryCost = (customization, sideName) => {
        if (!customization || !customization.type) return 0;
        const designEq = getDesignSourceEquivalent(customization.type);
        if (designEq === "EMBROIDERY_TEXT") {
            details.debug.push(`${sideName} Embroidery Text cost applied: ${EMBROIDERY_TEXT_COST.toFixed(2)}`);
            return EMBROIDERY_TEXT_COST;
        }
        if (designEq === "EMBROIDERY_DESIGN") { // From library
            details.debug.push(`${sideName} Embroidery Design Library cost applied: ${EMBROIDERY_DESIGN_LIBRARY_COST.toFixed(2)}`);
            return EMBROIDERY_DESIGN_LIBRARY_COST;
        }
        return 0;
    };

    details.embroideryCostFront = calculateEmbroideryCost(item.frontCustomization, "Front");
    details.embroideryCostBack = calculateEmbroideryCost(item.backCustomization, "Back");


    // 4. Area-Based Printing Cost Calculation (per side)
    // This applies if it's AI Text-to-Image or Uploaded Image. It does NOT apply to Embroidery or plain library designs (unless they are also vector prints).
    const calculateSidePrintingCost = (customization, tshirtSize, sideName) => {
        details.debug.push(`--- Calculating printing cost for ${sideName} ---`);
        if (!customization || !customization.type) {
            details.debug.push(`${sideName}: No customization or type. Print cost: 0`);
            return 0;
        }

        const designEq = getDesignSourceEquivalent(customization.type);
        // Only AI, OWN PHOTO, or STICKER (if stickers are printed) and LIBRARY_DESIGN (if they are also raster prints) are area-based.
        // AI_DRAW images are also area-based.
        const IS_AREA_PRINTABLE = ["AI", "OWN PHOTO", "STICKER", "AI_DRAW", "LIBRARY"].includes(designEq);

        if (!IS_AREA_PRINTABLE) {
            details.debug.push(`${sideName}: Type '${customization.type}' (Eq: ${designEq}) is not area-printable. Print cost: 0`);
            return 0;
        }
        if(designEq === "LIBRARY" && customization.costIncludedInBase) { // A flag to denote simple library designs priced at +20 total.
            details.debug.push(`${sideName}: Library design cost included in base addon or separate fee, not area based. Print Cost: 0`);
            return 0;
        }


        if (!customization.position || typeof customization.position.width !== 'number' || typeof customization.position.height !== 'number' || customization.position.width <= 0 || customization.position.height <= 0) {
            details.errors.push(`${sideName} has invalid/missing position data (width/height in UI pixels) for print cost calculation.`);
            details.debug.push(`${sideName}: Invalid position data: ${JSON.stringify(customization.position)}. Print cost: 0`);
            return 0;
        }

        const { width: canvaPixelWidth, height: canvaPixelHeight } = customization.position;
        details.debug.push(`${sideName}: UI Pixel W: ${canvaPixelWidth}, H: ${canvaPixelHeight}`);

        if (!tshirtSize) {
            details.errors.push(`T-shirt size missing for ${sideName} print cost.`);
            details.debug.push(`${sideName}: T-shirt size missing. Print cost: 0`);
            return 0;
        }
        if (!MAX_PRINT_AREAS_SQIN[tshirtSize]) {
            details.errors.push(`No max print area defined for size '${tshirtSize}'.`);
            details.debug.push(`${sideName}: No max print area (sq.in) for size '${tshirtSize}'. Print cost: 0`);
            return 0;
        }

        const maxRealSqInch = MAX_PRINT_AREAS_SQIN[tshirtSize];
        if (maxRealSqInch <= 0) {
            details.errors.push(`Max print area for size '${tshirtSize}' is invalid (<=0).`);
            details.debug.push(`${sideName}: Invalid max print area (sq.in) <=0 for size '${tshirtSize}'. Print cost: 0`);
            return 0;
        }

        // Convert UI pixel area of the design to real-world sq. inches
        // The UI_OUTER_PRINTABLE_PIXEL_AREA represents the maxRealSqInch on the screen.
        const pixelsToSqInchFactor = UI_OUTER_PRINTABLE_PIXEL_AREA / maxRealSqInch;
        if (pixelsToSqInchFactor <= 0) {
            details.errors.push(`Pixel to Sq.Inch conversion factor is invalid for size '${tshirtSize}'.`);
            details.debug.push(`${sideName}: Invalid pixelsToSqInchFactor <=0. Print cost: 0`);
            return 0;
        }

        let actualPrintSqIn = (canvaPixelWidth * canvaPixelHeight) / pixelsToSqInchFactor;
        details.debug.push(`${sideName}: Calculated Actual Print Sq.In: ${actualPrintSqIn.toFixed(2)}`);

        if (actualPrintSqIn > maxRealSqInch) {
            actualPrintSqIn = maxRealSqInch; // Cap at max
            details.debug.push(`${sideName}: Actual print area capped at max ${maxRealSqInch.toFixed(2)} sq.in.`);
        }
        if (actualPrintSqIn <= 0) {
            details.debug.push(`${sideName}: Actual print area is <= 0 after calculation/capping. Print cost: 0`);
            return 0;
        }

        const coverageRatio = actualPrintSqIn / maxRealSqInch;
        let fraction = "";
        if (coverageRatio <= 0.25) fraction = "1/4";
        else if (coverageRatio <= 0.50) fraction = "1/2";
        else if (coverageRatio <= 0.75) fraction = "3/4";
        else fraction = "Full";

        details.debug.push(`${sideName}: Coverage: ${coverageRatio.toFixed(3)}, Fraction Category: ${fraction}`);

        if (PRINTING_COSTS_BY_FRACTION[tshirtSize] && PRINTING_COSTS_BY_FRACTION[tshirtSize][fraction]) {
            const cost = PRINTING_COSTS_BY_FRACTION[tshirtSize][fraction];
            details.debug.push(`${sideName}: Print cost for size '${tshirtSize}', fraction '${fraction}': ${cost.toFixed(2)}`);
            return cost;
        } else {
            details.errors.push(`No print cost found for ${sideName}: size '${tshirtSize}', fraction '${fraction}'.`);
            details.debug.push(`${sideName}: Print cost lookup FAILED. Print cost: 0`);
            return 0;
        }
    };

    if (item.size && MAX_PRINT_AREAS_SQIN[item.size]) {
        details.printingCostFront = calculateSidePrintingCost(item.frontCustomization, item.size, "Front");
        details.printingCostBack = calculateSidePrintingCost(item.backCustomization, item.size, "Back");
    } else {
        const sizeErrorMsg = `T-shirt size '${item.size}' is invalid or not set for area-based printing cost. Print costs set to zero.`;
        details.errors.push(sizeErrorMsg);
        details.debug.push(sizeErrorMsg);
    }
    
    // 5. Specific cost for Design Library sticker (+₹20)
    // This is added if a library design is chosen and *it's not an embroidery design*.
    // Embroidery design library cost is handled by embroideryCostFront/Back.
    let libraryDesignStickerCost = 0;
    if (frontDesignEq === "LIBRARY" && getDesignSourceEquivalent(item.frontCustomization.type) !== "EMBROIDERY_DESIGN") {
        libraryDesignStickerCost += 20; // Example: As per Feature_Display "Design Library" price tag
    }
    if (backDesignEq === "LIBRARY" && getDesignSourceEquivalent(item.backCustomization.type) !== "EMBROIDERY_DESIGN") {
         // Check if it's the same design to avoid double charging, or if per-side application
         if (!item.frontCustomization || item.frontCustomization.src !== item.backCustomization.src || frontDesignEq !== "LIBRARY") {
            libraryDesignStickerCost += 20;
         }
    }
    if (libraryDesignStickerCost > 0) {
         details.debug.push(`Library Design Sticker cost: ${libraryDesignStickerCost.toFixed(2)}`);
    }


    // Total Unit Price
    details.totalUnitPrice = effectiveBaseForPrintingAndEmbroidery +
                             details.embroideryCostFront +
                             details.embroideryCostBack +
                             details.printingCostFront +
                             details.printingCostBack +
                             libraryDesignStickerCost;


    details.debug.push(`Final Unit Price calculated: ${details.totalUnitPrice.toFixed(2)}`);
    if (details.errors.length > 0) {
        console.warn("Price calculation encountered errors:", details.errors);
    }
    // console.log("Price Calculation Debug Log:", details.debug); // For verbose logging
    return details;
}

module.exports = calculatePriceDetails;