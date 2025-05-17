// backend/src/api/cartRoutes.js
// ... (other routes) ...
// backend/src/api/cartRoutes.js
const express = require('express');
const router = express.Router(); // <<<< MAKE SURE THIS LINE IS HERE AND CORRECT

const db = require('../models');
const { CartItem, ProductVariant, Customization } = db; // Destructure after db is required
const calculatePriceDetails = require('../services/priceCalculator'); // Adjust path if necessary

// Now you can define your routes:
router.get('/:cartSessionId', async (req, res) => {
    // ...
});
router.post('/:cartSessionId', async (req, res) => {
    const {
        productVariantId,
        quantity,
        frontCustomizationData, // Expects { type, src (can be base64), prompt, position, etc. }
        backCustomizationData,
    } = req.body;
    const { cartSessionId } = req.params;

    if (!productVariantId || !quantity || parseInt(quantity, 10) < 1) { /* ... */ }

    const transaction = await db.sequelize.transaction();
    try {
        const variant = await ProductVariant.findByPk(productVariantId);
        if (!variant) { /* ... */ }

        let frontCustomizationId = null;
        if (frontCustomizationData && frontCustomizationData.type) {
            // Here, frontCustomizationData.src MIGHT be a base64 string
            // The Customization.create will just save it as is to the `src` column (if TEXT)
            // No file saving logic here yet for the MVP.
            const frontCust = await Customization.create(frontCustomizationData, { transaction });
            frontCustomizationId = frontCust.id;
        }
        // ... similar for backCustomizationData ...
        let backCustomizationId = null;
        if (backCustomizationData && backCustomizationData.type) {
            const backCust = await Customization.create(backCustomizationData, { transaction });
            backCustomizationId = backCust.id;
        }


        // Construct item for backend price calculation
        const tempItemForPriceCalc = {
            productType: variant.productType,
            size: variant.size,
            color: variant.color,
            thickness: variant.thickness,
            thicknessName: variant.thicknessName,
            frontCustomization: frontCustomizationData, // Use the raw data that came in
            backCustomization: backCustomizationData,
            quantity: parseInt(quantity, 10),
        };

        const priceDetails = calculatePriceDetails(tempItemForPriceCalc); // This is your backend service
        if (priceDetails.errors && priceDetails.errors.length > 0) {
            await transaction.rollback();
            console.error("Pricing errors on add to cart (backend):", priceDetails.errors, "Item data for calc:", tempItemForPriceCalc);
            return res.status(400).json({ message: "Error calculating price on server.", errors: priceDetails.errors });
        }

        const newCartItem = await CartItem.create({
            cartSessionId,
            productVariantId,
            frontCustomizationId,
            backCustomizationId,
            quantity: parseInt(quantity, 10),
            calculatedUnitPrice: priceDetails.totalUnitPrice,
            priceBreakdown: { /* ... populated from priceDetails ... */
                baseShirtCost: priceDetails.baseShirtCost,
                designAddonCost: priceDetails.designAddonCost,
                embroideryCostFront: priceDetails.embroideryCostFront,
                embroideryCostBack: priceDetails.embroideryCostBack,
                printingCostFront: priceDetails.printingCostFront,
                printingCostBack: priceDetails.printingCostBack,
                libraryDesignStickerCost: priceDetails.libraryDesignStickerCostTotal // Assuming you added this to backend calc
            }
        }, { transaction });

        await transaction.commit();
        const createdItemWithAssociations = await CartItem.findByPk(newCartItem.id, { /* ... includes ... */
            include: [
                { model: ProductVariant, as: 'variant' },
                { model: Customization, as: 'frontDesign' },
                { model: Customization, as: 'backDesign' },
            ]
        });
        res.status(201).json(createdItemWithAssociations);
    } catch (error) { /* ... rollback and error response ... */
        await transaction.rollback();
        console.error("Error adding item to cart (backend):", error);
        res.status(500).json({ message: "Error adding item to cart on server", error: error.message });
    }
});

// ... (other cart routes like PUT, DELETE, GET) ...
module.exports = router;