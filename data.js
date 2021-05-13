class Data {
    constructor(wheel) {
        this.wheel = wheel; 
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
    }

    clear() {
        data = []
    }

    getCount() {
        return this.data.length;
    }

    getExpectedMean() {
        let mean = 0;
        // random variable represented by outermost sectors
        let randomVariable = this.wheel.sectors[this.wheel.sectors.length-1];
        
        for (let x = 0; x < randomVariable.length; x++) {
            let sector = randomVariable[x];
            mean += sector.value * sector.probability;
        }

        return mean;
    }

    getExpectedVariance() {
        let variance = 0;
        // random variable represented by outermost sectors
        let randomVariable = this.wheel.sectors[this.wheel.sectors.length-1];
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
}

function updateData(data) {
    let count = document.getElementById('count');
    let expectedMean = document.getElementById('expected-mean');
    let expectedVariance = document.getElementById('expected-variance');
    let sampleMean = document.getElementById('sample-mean');
    let sampleVariance = document.getElementById('sample-variance');
    let maxValue = document.getElementById('maximum-value');
    let minValue = document.getElementById('minimum-value');
    let probability = document.getElementById('probability');

    count.innerHTML = "Count: " + data.getCount();
    expectedMean.innerHTML = "Expected Mean: " + data.getExpectedMean();
    expectedVariance.innerHTML = "Expected Variance: " + data.getExpectedVariance();
    sampleMean.innerHTML = "Sample Mean: " + data.getSampleMean();
    sampleVariance.innerHTML = "Sample Variance: " + data.getSampleVariance();
    maxValue.innerHTML = "Maximum Value: " + data.getMax();
    minValue.innerHTML = "Minimum Value: " + data.getMin();
    if (data.wheel.selected) {
        probability.innerHTML = "Probability: " + data.wheel.selected.probability;
    }
    else   
        probability.innerHTML = "Probability: 0";
}

export { Data, updateData };