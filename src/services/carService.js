const BaseRepository = require('./../repository/base/baseRepository')
const Tax = require('./../entities/tax')
const Transaction = require('./../entities/transaction')

class CarService {
    constructor({ cars }) {
        this.carRepository = new BaseRepository({ file: cars })
        this.taxesBasedOnAge = Tax.taxesBasedOnAge
        this.currencyFormat = new Intl.NumberFormat('pt-br', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    getRandomPositionFromArray(list) {
        return Math.floor(
            Math.random() * (list.length)
        )
    }

    chooseRandomCar(carCategory) {
        const position = this.getRandomPositionFromArray(carCategory)
        return carCategory.carIds[position]
    }

    async getAvailableCar(carCategory) {
        const carId = this.chooseRandomCar(carCategory)
        return (await this.carRepository.find(carId))
    }

    async calculateFinalPrice(carCategory, customer, numberOfDays) {
        const { price } = carCategory
        const { age } = customer

        const { then: tax } = this.taxesBasedOnAge.find(tax => age >= tax.from && age <= tax.to)
        const value = ((tax * price) * numberOfDays)
        return this.currencyFormat.format(value)
    }

    async rent(customer, carCategory, numberOfDays) {
        const amount = await this.calculateFinalPrice(carCategory, customer, numberOfDays)
        const car = await this.getAvailableCar(carCategory)

        const today = new Date()
        today.setDate(today.getDate() + numberOfDays)
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        const dueDate = today.toLocaleDateString('pt-br', options)

        return new Transaction({ car, customer, dueDate, amount })
    }
}

module.exports = CarService