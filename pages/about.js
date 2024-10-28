import NavBar from '@/components/ui/navBar';  

export default function About() {
  return (
      <div style={pageStyles}>
        <NavBar />
          <h1 className="text-center" style={aboutpageTitleStyles}>
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
  textTransform: 'uppercase', 
  marginTop: '80px',     
  color: '#000',         
  textAlign: 'center',  
};
