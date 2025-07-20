// Calculs des KPIs
const kpiCalculations = {
    // TRS/OEE (Overall Equipment Effectiveness)
    calculateOEE(data) {
        const availability = this.calculateAvailability(data);
        const performance = this.calculatePerformance(data);
        const quality = this.calculateQuality(data);
        
        return {
            value: (availability.value * performance.value * quality.value / 10000).toFixed(1),
            components: { availability, performance, quality }
        };
    },

    // Disponibilité = (Temps de production - Temps d'arrêt) / Temps requis
    calculateAvailability(data) {
        const requiredTime = data.shift_duration || 480; // 8h par défaut
        const lostTime = data.total_lost_time || 0;
        const availableTime = requiredTime - lostTime;
        
        return {
            value: Math.max(0, (availableTime / requiredTime * 100)).toFixed(1),
            numerator: availableTime,
            denominator: requiredTime
        };
    },

    // Performance = Production réelle / Production théorique
    calculatePerformance(data) {
        const theoreticalOutput = this.getTheoreticalOutput(data);
        const actualOutput = data.total_length || 0;
        
        return {
            value: theoreticalOutput > 0 ? 
                Math.min(100, (actualOutput / theoreticalOutput * 100)).toFixed(1) : 0,
            actual: actualOutput,
            theoretical: theoreticalOutput
        };
    },

    // Qualité = Rouleaux OK / Rouleaux totaux
    calculateQuality(data) {
        const totalRolls = data.total_rolls || 0;
        const conformRolls = data.conform_rolls || 0;
        
        return {
            value: totalRolls > 0 ? 
                (conformRolls / totalRolls * 100).toFixed(1) : 100,
            conform: conformRolls,
            total: totalRolls
        };
    },

    // Productivité (m/h ou kg/h)
    calculateProductivity(data) {
        const production = data.total_length || 0;
        const productionTime = (data.shift_duration - data.total_lost_time) / 60; // en heures
        
        return {
            value: productionTime > 0 ? 
                (production / productionTime).toFixed(0) : 0,
            unit: 'm/h'
        };
    },

    // Taux de rebut
    calculateScrapRate(data) {
        const totalRolls = data.total_rolls || 0;
        const nokRolls = totalRolls - (data.conform_rolls || 0);
        
        return {
            value: totalRolls > 0 ? 
                (nokRolls / totalRolls * 100).toFixed(1) : 0,
            nok: nokRolls,
            total: totalRolls
        };
    },

    // MTBF (Mean Time Between Failures)
    calculateMTBF(data) {
        const breakdowns = data.breakdown_count || 0;
        const operatingTime = data.shift_duration - data.total_lost_time;
        
        return {
            value: breakdowns > 0 ? 
                (operatingTime / breakdowns).toFixed(0) : operatingTime,
            unit: 'min',
            breakdowns: breakdowns
        };
    },

    // Rendement matière
    calculateMaterialYield(data) {
        const rawMaterial = data.raw_material_kg || 1;
        const finishedProduct = data.finished_product_kg || 0;
        
        return {
            value: (finishedProduct / rawMaterial * 100).toFixed(1),
            efficiency: finishedProduct,
            consumed: rawMaterial
        };
    },

    // Helper: Production théorique basée sur la vitesse
    getTheoreticalOutput(data) {
        const speed = data.belt_speed || 0; // m/min
        const availableTime = (data.shift_duration - data.total_lost_time);
        return speed * availableTime;
    }
};

// Export pour utilisation dans d'autres modules
window.kpiCalculations = kpiCalculations;