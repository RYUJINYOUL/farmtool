import Image from "next/image";


const Footer = () => {


return (
     
    <section>
    
     <section className='md:hidden block'>
          <hr className="h-2.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50 md:w-[1000px] w-screen"/>
     </section>       
     
     <div className='mt-7'/>
         <div className='md:mb-18 mb-4'>
         <div className='w-full flex flex-col justify-center items-center gap-3'>
              <ul className="list_info flex flex-col items-center">
                <li className='text-[#000000] text-[15px] font-semibold'>
                  <span className="item_description">건설톡</span>
                </li>
                 <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">대표자 : </span>
                  <span className="item_description">유준열</span>
                </li>
                 <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">전화번호 : </span>
                  <span className="item_description">010-4055-1330</span>
                </li>
                 <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">이메일 : </span>
                  <span className="item_description">dalkomme@gmail.com</span>
                </li>
                 <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">주소 : </span>
                  <span className="item_description">
                    경기도 화성시 동탄대로 706, 333호(영천동, 동탄아이티밸리)
                  </span>
                </li>
                 <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">사업자정보 : </span>
                  <span className="item_description">338-30-00921</span>
                </li>
                 {/* <li className='text-[#959595] text-[13px]'>
                  <span className="item_title">기타 :</span>
                  <span className="item_description">등록번호 제41360-2019-60141호</span>
                </li> */}

                 <div className='mt-5'/>  
                        
                        {/* <a href='https://m.search.naver.com/search.naver?query=%EB%82%A8%EC%96%91%EC%A3%BC%EC%B0%BD%EA%B3%A0%EB%B0%95%EC%82%AC%40' target='_blank'>
                        <li className='text-[#959595] p-2 text-[13px] border-1 border-[#9d9d9d]'>
                          <span className="item_title">남양주창고박사</span>
                        </li>
                        </a> */}
              </ul>

           </div>
         </div>
         
      <div className='mt-7'/>    
      <section className='md:hidden block'>
          <hr className="h-2.5 border-t-0 bg-neutral-200 opacity-100 dark:opacity-50 md:w-[1000px] w-screen"/>
      </section>   
     </section>
 )
}

export default Footer;