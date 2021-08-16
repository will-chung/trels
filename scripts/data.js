class Data {
    constructor(roulette) {
        this.roulette = roulette; 
        this.data = [];
        this.max = 0;
        this.min = 0;
    }

    add(value) {
        this.data.push(value);
        
        if (value > this.max)
            this.max = value;
        if (value < this.min) 
            this.min = value;

        this.update();
    }

    clear() {
        this.data = [];
    }

    getCount() {
        return this.data.length;
    }

    getExpectedMean() {
        let wheels = this.roulette.wheels;
        let mean = 0;
        // random variable represented by outermost wheel
        let randomVariable = wheels[wheels.length-1].sectors;
        
        for (let x = 0; x < randomVariable.length; x++) {
            let sector = randomVariable[x];
            mean += sector.value * sector.probability;
        }

        return mean;
    }

    getExpectedVariance() {
        const wheels = this.roulette.wheels; 
        let variance = 0;
        // random variable represented by outermost wheel
        let randomVariable = wheels[wheels.length-1].sectors;
        let mean = this.getExpectedMean();
        
        for (let x = 0; x < randomVariable.length; x++) {
            let sector = randomVariable[x];
            variance += Math.pow(sector.value - mean,2) * sector.probability;
        }

        return variance;
    }
    
    getSampleMean() {
        if (this.data.length == 0)
            return 0;

        let total = this.getTotal();

        return total/this.data.length;
    }

    getSampleVariance() {
        if (this.data.length <= 1)
            return 0;

        let sampleVariance;
        let sampleMean = this.getSampleMean();
        let total = 0;     

        for (let i = 0; i < this.data.length; i++) {
            total += Math.pow(this.data[i] - sampleMean, 2);
        }

        sampleVariance = total/(this.data.length - 1);

        return sampleVariance;
    }

    getTotal() {
        let total = 0;

        for (let i = 0; i < this.data.length; i++) {
            total += this.data[i];
        }     
        
        return total;
    }

    getMax() {
        return this.max;
    }

    getMin() {
        return this.min;
    }

    setProbability(probability) {
        let probLabel = document.getElementById('probability');

        probLabel.textContent = 'Probability: ' + probability;
    }

    update() {
        let count = document.getElementById('count');
        let expectedMean = document.getElementById('expected-mean');
        let expectedVariance = document.getElementById('expected-variance');
        let sampleMean = document.getElementById('sample-mean');
        let sampleVariance = document.getElementById('sample-variance');
        let maxValue = document.getElementById('maximum-value');
        let minValue = document.getElementById('minimum-value');
        let probability = document.getElementById('probability');

        count.innerHTML = "Count: " + this.getCount();
        expectedMean.innerHTML = "Expected Mean: " + this.getExpectedMean();
        expectedVariance.innerHTML = "Expected Variance: " + this.getExpectedVariance();
        sampleMean.innerHTML = "Sample Mean: " + this.getSampleMean();
        sampleVariance.innerHTML = "Sample Variance: " + this.getSampleVariance();
        maxValue.innerHTML = "Maximum Value: " + this.getMax();
        minValue.innerHTML = "Minimum Value: " + this.getMin();
        if (this.roulette.selectedSector) {
            probability.innerHTML = "Probability: " + this.roulette.selectedSector.probability;
        }
        else   
            probability.innerHTML = "Probability: 0";
    }
}

export { Data };