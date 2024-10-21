import useCountStore from '@/stores'

const Home = () => {
  const { count, add, dec } = useCountStore()

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-4'>
        <p>router: `src/router/`</p>
        <p>stores: `src/stores/`</p>
      </div>
      <div className='flex gap-2 mb-4 text-xl'>
        <span>count:</span>
        <span>{count}</span>
      </div>
      <div className='flex gap-2'>
        <button className='bg-neutral-500 px-2 rounded-md text-white' onClick={add}>+</button>
        <button className='bg-neutral-500 px-2 rounded-md text-white' onClick={dec}>-</button>
      </div>
    </div>
  )
}

export default Home