const { describe, it, before, beforeEach, afterEach } = require('mocha')
const { expect } = require('chai')
const sinon = require('sinon')
const request = require('supertest')

const CarService = require('./../../src/services/carService')
const SERVER_TEST_PORT = 4000

const mocks = {
    validCar: require('./../mocks/valid-car.json'),
    validCarCategory: require('./../mocks/valid-carCategory.json'),
    validCustomer: require('./../mocks/valid-customer.json')
}

describe('E2E API Suite test', () => {
    let app = {}
    let sandbox = {}

    before(() => {
        const api = require('./../../src/api')
        const carService = new CarService({ cars: mocks.validCar })
        const instance = api({ carService })

        app = {
            instance,
            server: instance.initialize(SERVER_TEST_PORT)
        }
    })

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('/calculateFinalPrice:post', () => {
        it('given a carCategory, a customer and numberOfDays, should be able to calculate final amount in real', async () => {
            const car = { ...mocks.validCar }
            const carCategory = { 
                ...mocks.validCarCategory, 
                price: 37.6,
                carIds: [car.id]
            }
            const customer = {
                ...mocks.validCustomer,
                age: 50,
            }

            const numberOfDays = 5

            const body = {
                carCategory,
                customer,
                numberOfDays
            }

            sandbox.stub(
                app.instance.carService.carRepository,
                app.instance.carService.carRepository.find.name,
            ).resolves(car)

            const expected = {
                result: app.instance.carService.currencyFormat.format(244.40)
            }
            const response = await request(app.server)
                .post('/calculateFinalPrice')
                .send(body)
                .expect(200)

            expect(response.body).to.be.deep.equal(expected)
        })
    })

    describe('/getAvailableCar:post', () => {
        it('given a carCategory, it should return an available car', async () => {
            const car = { ...mocks.validCar }
            const carCategory = { 
                ...mocks.validCarCategory, 
                price: 37.6,
                carIds: [car.id]
            }

            const body = { carCategory }

            sandbox.stub(
                app.instance.carService.carRepository,
                app.instance.carService.carRepository.find.name,
            ).resolves(car)

            const expected = {
                result: car
            }
            const response = await request(app.server)
                .post('/getAvailableCar')
                .send(body)
                .expect(200)

            expect(response.body).to.be.deep.equal(expected)
        })
    })

    describe('/rent:post', () => {
        it('given a customer and a car category it should return a transaction receipt', async () => {
            const car = { ...mocks.validCar }
            const carCategory = { 
                ...mocks.validCarCategory, 
                price: 37.6,
                carIds: [car.id]
            }
            const customer = {
                ...mocks.validCustomer,
                age: 50,
            }

            const numberOfDays = 5

            const expectedAmount = app.instance.carService.currencyFormat.format(244.40)
            const dueDate = '10 de novembro de 2020'
            const now = new Date(2020, 10, 5)
            sandbox.useFakeTimers(now.getTime())

            sandbox.stub(
                app.instance.carService.carRepository,
                app.instance.carService.carRepository.find.name,
            ).resolves(car)


            const body = {
                customer, carCategory, numberOfDays
            }
            const expected = {
                result: {
                    customer,
                    car,
                    amount: expectedAmount,
                    dueDate
                }
            }
            
            const response = await request(app.server)
                .post('/rent')
                .send(body)
                .expect(200)

            expect(response.body).to.be.deep.equal(expected)
        })
    })
})