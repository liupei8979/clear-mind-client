const Home = () => {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
            <p className="text-lg mb-6">This is the root page of your app!</p>
            <a
                href="/about"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                Learn More
            </a>
        </div>
    )
}

export default Home
