const { describe, it, before, beforeEach, afterEach } = require('mocha')
const { expect } = require('chai')
const sinon = require('sinon')

const CarService = require('./../../src/services/carService')
const Transaction = require('./../../src/entities/transaction')

const mocks = {
    validCar: require('./../mocks/valid-car.json'),
    validCarCategory: require('./../mocks/valid-carCategory.json'),
    validCustomer: require('./../mocks/valid-customer.json')
}

describe('CarService Suit Test', () => {
    let carService = {}
    let sandbox = {}

    before(() => {
        carService = new CarService({ cars: mocks.validCar })
    })

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should return a random position from an array', () => {
        const data = [0, 1, 2, 3, 4, 5]
        const result = carService.getRandomPositionFromArray(data)

        expect(result).to.be.lte(data.length).to.be.gte(0)
    })

    it('Should choose the first id from carIds in carCategory', () => {
        const carCategory = mocks.validCarCategory
        const carIdIndex = 0

        sandbox.stub(
            carService,
            carService.getRandomPositionFromArray.name
        ).returns(carIdIndex)

        const result = carService.chooseRandomCar(carCategory)
        const expected = carCategory.carIds[carIdIndex]

        expect(result).to.be.equal(expected)
    })

    it('given a carCategory it should return an available car!', async () => {
        const car = mocks.validCar
        const carCategory = Object.create(mocks.validCarCategory)
        carCategory.carIds = [car.id]

        sandbox.stub(
            carService.carRepository,
            carService.carRepository.find.name
        ).resolves(car)

        sandbox.spy(
            carService,
            carService.chooseRandomCar.name
        )

        const result = await carService.getAvailableCar(carCategory)
        const expected = car

        expect(carService.chooseRandomCar.calledOnce).to.be.ok
        expect(carService.carRepository.find.calledWithExactly(car.id))
        expect(result).to.be.deep.equal(expected)
    })

    it('given a carCategory, numberOfDays and a customer, should be able to determine the final rent for a car', async () => {
        const carCategory = { ...mocks.validCarCategory, price: 37.6 }
        const customer = { ...mocks.validCustomer, age: 50 }

        const numberOfDays = 5

        sandbox.stub(
            carService,
            'taxesBasedOnAge'
        ).get(() => [{ from: 40, to: 50, then: 1.3 }])

        const result = await carService.calculateFinalPrice(carCategory, customer, numberOfDays)
        const expected = carService.currencyFormat.format(244.4)

        expect(result).to.be.deep.equal(expected)
    })

    it('given a carCategory and a customer, should be able to return a transaction receipt', async () => {
        const car = { ...mocks.validCar }
        const carCategory = { 
            ...mocks.validCarCategory, 
            carIds: [car.id], 
            price: 37.6 
        }
        const customer = { 
            ...mocks.validCustomer, 
            age: 50 
        }

        const numberOfDays = 5
        const dueDate = '10 de novembro de 2020'
        const now = new Date(2020, 10, 05)
        
        sandbox.useFakeTimers(now.getTime())
        sandbox.stub(
            carService.carRepository,
            carService.carRepository.find.name
        ).resolves(car)

        const expectAmount = carService.currencyFormat.format(244.40)
        const result = await carService.rent(customer, carCategory, numberOfDays)

        const expected = new Transaction({
            customer,
            car,
            amount: expectAmount,
            dueDate
        })

        expect(result).to.be.deep.equal(expected)
    })
})