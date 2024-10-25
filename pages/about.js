import { Poppins } from "next/font/google";
import NavBar from '@/components/ui/navBar';  

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '300'],
});

export default function About() {
  return (
      <div style={pageStyles}>
        <NavBar />
          <h1 className={`${poppins.className} text-center`} style={aboutpageTitleStyles}>
              About Me
          </h1>
      </div>
  );
}
// css
const pageStyles = {
  backgroundColor: '#fff',
  width: '225vh',   
  height: '100vh',           
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}
const aboutpageTitleStyles = {
  fontSize: '5rem',      
  fontWeight: 900,       
  textTransform: 'uppercase', 
  marginTop: '80px',     
  color: '#000',         
  textAlign: 'center',  
};
