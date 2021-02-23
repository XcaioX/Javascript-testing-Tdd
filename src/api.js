const http = require('http')

const CarService = require('./services/carService')

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json'
}
const DEFAULT_PORT = 8000

const defaultFactory = () => ({
    carService: new CarService({ cars: './../database/cars.json' })
})

class Api {

    constructor(dependencies = defaultFactory()) {
        this.carService = dependencies.carService
    }

    generateRoutes () {
        return {
            '/rent:post': async (request, response) => {
                for await(const data of request) {
                    try {
                        const { customer, carCategory, numberOfDays } = JSON.parse(data)
                        const result = await this.carService.rent(customer, carCategory, numberOfDays)
                        
                        response.writeHead(200, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ result }))
                        response.end()
                    } catch (error) {
                        console.log(`Error ::: ${error}`)
                        response.writeHead(500, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ error }))
                        response.end()
                    }
                }
            },
            
            '/calculateFinalPrice:post': async (request, response) => {
                for await(const data of request) {
                    try {
                        const { customer, carCategory, numberOfDays } = JSON.parse(data)
                        const result = await this.carService.calculateFinalPrice(carCategory, customer, numberOfDays)
                        
                        response.writeHead(200, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ result }))
                        response.end()
                    } catch (error) {
                        console.log(`Error ::: ${error}`)
                        response.writeHead(500, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ error }))
                        response.end()
                    }
                }
            },
            
            '/getAvailableCar:post': async (request, response) => {
                for await(const data of request) {
                    try {
                        const { carCategory } = JSON.parse(data)
                        const result = await this.carService.getAvailableCar(carCategory)

                        response.writeHead(200, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ result }))
                        response.end()
                    } catch (error) {
                        console.log(`Error ::: ${error}`)
                        response.writeHead(500, DEFAULT_HEADERS)
                        response.write(JSON.stringify({ error }))
                        response.end()
                    }
                }
            },
            
            default: (request, response) => {
                response.write(JSON.stringify({ success: 'Hello, world!' }))
                return response.end()
            },
        }
    }

    handler (request, response) {
        const { url, method } = request
        const routeKeys = `${url}:${method.toLowerCase()}`

        const routes = this.generateRoutes()
        const chose = routes[routeKeys] || routes.default

        response.writeHead(200, DEFAULT_HEADERS)

        return chose(request, response)
    }

    initialize (port = DEFAULT_PORT) {
        const app = http.createServer(this.handler.bind(this))
                        .listen(port, _ => console.log('App running at', port))

        return app                        
    }

}

if (process.env.NODE_ENV !== 'test') {
    const api = new Api()
    return api.initialize()
}

module.exports = (dependencies) => new Api(dependencies)