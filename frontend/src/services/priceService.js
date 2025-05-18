// frontend/src/services/priceService.js

// --- Updated Base Costs ---
const BASE_COSTS = {
    "180": 399.00, // Forma Flow
    "240": 599.00  // Forma Dense
};

// --- Feature Addon Costs ---
const DESIGN_LIBRARY_ADDON_COST = 20.00;  // Flat cost for selecting a printable library design
const AI_UPLOAD_DRAW_ADDON_COST = 50.00; // Flat cost for using AI Text-to-Image, Upload Image, or AI Draw
const EMBROIDERY_TEXT_COST = 80.00;
const EMBROIDERY_DESIGN_LIBRARY_COST = 50.00; // For an embroidery design chosen from a library

// --- Printing Area Calculation Constants ---
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

// --- Helper Function to Categorize Customization Types ---
function getDesignSourceEquivalent(customizationType) {
    if (!customizationType) return "PLAIN";
    // More specific types for clarity in pricing
    if (customizationType === 'ai_text_image') return "AI_TEXT_IMAGE";
    if (customizationType === 'uploaded_image') return "UPLOADED_IMAGE";
    if (customizationType === 'library_design') return "LIBRARY_DESIGN"; // For printable/scalable library designs
    if (customizationType === 'multi_library_design') return "MULTI_LIBRARY_DESIGN"; // For multiple sticker-like placements
    if (customizationType === 'embroidery_text') return "EMBROIDERY_TEXT";
    if (customizationType === 'embroidery_design') return "EMBROIDERY_DESIGN"; // Specifically for library embroidery
    if (customizationType === 'ai_draw_image') return "AI_DRAW_IMAGE";
    if (customizationType === 'sticker') return "STICKER"; // If you have a distinct sticker type
    return "OTHER_CUSTOM";
}

export function calculatePriceDetailsForUI(item) {
    console.log("PRICE_SERVICE_UI: V3 Calculating for item:", item ? JSON.parse(JSON.stringify(item)) : "null item");

    const details = {
        baseShirtCost: 0,
        flatAddonCost: 0,          // For AI/Upload/Draw types (applied once)
        libraryDesignAccessCost: 0,// Sum of all +₹20 for each printable library design used
        embroideryCostFront: 0,
        embroideryCostBack: 0,
        printingCostFront: 0,      // Scaled printing cost for front
        printingCostBack: 0,       // Scaled printing cost for back
        totalUnitPrice: 0,
        errors: [],
        debug: []
    };

    if (!item) {
        details.errors.push("No item data provided to price service.");
        return { totalUnitPrice: 0, priceBreakdownForDisplay: {}, errors: details.errors };
    }

    details.debug.push(`UI CALC: Size ${item.size}, Thickness ${item.thickness}`);

    // 1. Base Shirt Cost
    if (!item.thickness || !BASE_COSTS[String(item.thickness)]) {
        details.errors.push(`Item thickness (GSM) '${item.thickness}' is invalid or not set for base cost.`);
        details.debug.push(`UI CALC ERROR: Invalid GSM: ${item.thickness}. Valid keys: ${Object.keys(BASE_COSTS)}`);
        // Return early if no base cost can be determined
        return { totalUnitPrice: 0, priceBreakdownForDisplay: { baseGSM: "Error" }, errors: details.errors };
    }
    const gsmKey = String(item.thickness);
    details.baseShirtCost = BASE_COSTS[gsmKey];
    details.debug.push(`UI CALC: Base GSM cost for ${gsmKey}: ${details.baseShirtCost.toFixed(2)}`);

    // Flags to ensure flat addons are applied only once if applicable
    let aiUploadDrawAddonApplied = false;

    // Function to process customization for a single side (front or back)
    const processSide = (customization, sideName) => {
        if (!customization || !customization.type) {
            details.debug.push(`UI CALC (${sideName}): No customization.`);
            return;
        }

        const custEqType = getDesignSourceEquivalent(customization.type);
        details.debug.push(`UI CALC (${sideName}): Processing type '${custEqType}' (Original: '${customization.type}')`);

        // A. Flat Addon Costs based on feature type
        if (["AI_TEXT_IMAGE", "UPLOADED_IMAGE", "AI_DRAW_IMAGE"].includes(custEqType)) {
            if (!aiUploadDrawAddonApplied) {
                details.flatAddonCost += AI_UPLOAD_DRAW_ADDON_COST;
                aiUploadDrawAddonApplied = true; // Ensure this +50 is only added once per item
                details.debug.push(`UI CALC: Applied AI/Upload/Draw Feature Addon: ${AI_UPLOAD_DRAW_ADDON_COST.toFixed(2)}`);
            }
        } else if (custEqType === "LIBRARY_DESIGN") {
            // This is for a printable/scalable library design (not embroidery)
            // Each placement of such a design adds the library access cost.
            details.libraryDesignAccessCost += DESIGN_LIBRARY_ADDON_COST;
            details.debug.push(`UI CALC (${sideName}): Added Printable Library Design Access Cost: ${DESIGN_LIBRARY_ADDON_COST.toFixed(2)}`);
        } else if (custEqType === "MULTI_LIBRARY_DESIGN" && Array.isArray(customization.elements)) {
             // For multi-sticker type, sum the price of each element (assuming each is +20)
             customization.elements.forEach(el => {
                if (el.price) { // Assuming element from multi_library_design has its own .price
                    details.libraryDesignAccessCost += el.price; 
                    details.debug.push(`UI CALC (${sideName}): Added Multi-Lib Element Sticker Cost: ${el.price.toFixed(2)}`);
                } else { // Fallback if element.price isn't set, apply standard library cost
                    details.libraryDesignAccessCost += DESIGN_LIBRARY_ADDON_COST;
                     details.debug.push(`UI CALC (${sideName}): Added Multi-Lib Element (default) Sticker Cost: ${DESIGN_LIBRARY_ADDON_COST.toFixed(2)}`);
                }
            });
        } else if (custEqType === "EMBROIDERY_TEXT") {
            const cost = EMBROIDERY_TEXT_COST;
            if (sideName === "Front") details.embroideryCostFront += cost;
            else details.embroideryCostBack += cost;
            details.debug.push(`UI CALC (${sideName}): Added Embroidery Text Cost: ${cost.toFixed(2)}`);
        } else if (custEqType === "EMBROIDERY_DESIGN") { // Embroidery design from library
            const cost = EMBROIDERY_DESIGN_LIBRARY_COST;
            if (sideName === "Front") details.embroideryCostFront += cost;
            else details.embroideryCostBack += cost;
            details.debug.push(`UI CALC (${sideName}): Added Embroidery Design (from Library) Cost: ${cost.toFixed(2)}`);
        }

        // B. Area-Based Printing Cost Calculation (only for non-embroidery, printable types)
        const IS_SCALABLE_PRINT = ["AI_TEXT_IMAGE", "UPLOADED_IMAGE", "AI_DRAW_IMAGE", "LIBRARY_DESIGN"].includes(custEqType);
        
        if (IS_SCALABLE_PRINT) {
            if (!customization.position || typeof customization.position.width !== 'number' || typeof customization.position.height !== 'number' || customization.position.width <= 0 || customization.position.height <= 0) {
                details.errors.push(`${sideName} printing type '${custEqType}' requires valid position data (width/height). Area cost not applied.`);
                details.debug.push(`UI CALC (Print ${sideName}): Invalid position data for ${custEqType}. Printing Cost: 0.`);
                return; // No scaled print cost if no position data
            }
            const { width: canvaPixelWidth, height: canvaPixelHeight } = customization.position;
            if (!item.size || !MAX_PRINT_AREAS_SQIN[item.size]) {
                details.errors.push(`Invalid T-shirt size ('${item.size}') for ${sideName} area print cost.`); return;
            }
            const maxRealSqInch = MAX_PRINT_AREAS_SQIN[item.size];
            if (maxRealSqInch <= 0) { details.errors.push(`Max print area for size '${item.size}' invalid.`); return; }
            const pixelsToSqInchFactor = UI_OUTER_PRINTABLE_PIXEL_AREA / maxRealSqInch;
            if (pixelsToSqInchFactor <= 0) { details.errors.push(`Pixel to Sq.Inch factor invalid.`); return; }
            
            let actualPrintSqIn = (canvaPixelWidth * canvaPixelHeight) / pixelsToSqInchFactor;
            actualPrintSqIn = Math.min(actualPrintSqIn, maxRealSqInch); // Cap at max
            
            if (actualPrintSqIn <= 0) {
                details.debug.push(`UI CALC (Print ${sideName}): Actual area <=0 after calculation for ${custEqType}. Scaled Printing Cost: 0.`);
                return; // No print cost if area is zero
            }

            const coverageRatio = actualPrintSqIn / maxRealSqInch;
            let fraction = coverageRatio <= 0.25 ? "1/4" : coverageRatio <= 0.50 ? "1/2" : coverageRatio <= 0.75 ? "3/4" : "Full";
            
            if (PRINTING_COSTS_BY_FRACTION[item.size] && PRINTING_COSTS_BY_FRACTION[item.size][fraction]) {
                const printingCostForSide = PRINTING_COSTS_BY_FRACTION[item.size][fraction];
                if (sideName === "Front") details.printingCostFront += printingCostForSide;
                else details.printingCostBack += printingCostForSide;
                details.debug.push(`UI CALC (Print ${sideName}): Size '${item.size}', type '${custEqType}', fraction '${fraction}', Scaled Printing Cost: ${printingCostForSide.toFixed(2)}`);
            } else {
                details.errors.push(`No print cost found for ${sideName}: size '${item.size}', fraction '${fraction}'.`);
            }
        } else if (custEqType === "MULTI_LIBRARY_DESIGN" && Array.isArray(customization.elements)) {
            // For multi_library_design, area-based printing costs are NOT applied per element.
            // The flat DESIGN_LIBRARY_ADDON_COST per element covers it.
             details.debug.push(`UI CALC (${sideName}): Type '${custEqType}' elements priced individually, no further area cost for main container.`);
        }
    };

    processSide(item.frontCustomization, "Front");
    processSide(item.backCustomization, "Back");
    
    // Consolidate all addon costs
    // The `flatAddonCost` is for AI/Upload/Draw (once per item)
    // The `libraryDesignAccessCost` is sum of +20 for each printable library design instance (or elements in multi-design)
    // Embroidery costs are separate per side.
    // Printing costs are separate per side and scaled.
    details.totalUnitPrice = details.baseShirtCost +
                             details.flatAddonCost +
                             details.libraryDesignAccessCost +
                             details.embroideryCostFront +
                             details.embroideryCostBack +
                             details.printingCostFront +
                             details.printingCostBack;

    details.debug.push(`UI CALC: Final Total Unit Price: ${details.totalUnitPrice.toFixed(2)}`);
    if (details.errors.length > 0) {
        console.warn("UI Price service calculation encountered errors:", JSON.stringify(details.errors));
    }
    // For debugging the entire flow:
    // console.log("UI Price Calculation Debug Log:", details.debug);

    return {
        totalUnitPrice: parseFloat(details.totalUnitPrice.toFixed(2)),
        priceBreakdownForDisplay: {
            baseGSM: details.baseShirtCost.toFixed(2),
            flatAddon: details.flatAddonCost.toFixed(2), // For AI/Upload/Draw
            libraryAccess: details.libraryDesignAccessCost.toFixed(2), // Sum of Library +20s
            printFront: details.printingCostFront.toFixed(2),
            printBack: details.printingCostBack.toFixed(2),
            embroideryFront: details.embroideryCostFront.toFixed(2),
            embroideryBack: details.embroideryCostBack.toFixed(2),
        },
        errors: details.errors.length > 0 ? details.errors : null,
        // debugInfo: details.debug // Optionally return debug info
    };
}