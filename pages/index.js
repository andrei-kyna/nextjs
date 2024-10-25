import { Poppins } from "next/font/google";
import NavBar from '@/components/ui/navBar';
import { useSession } from "next-auth/react";  

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '300'],
});

// Define the white color in CSS or use a direct color value
const pageStyles = {
  backgroundColor: '#fff',
  width: '225vh',   
  height: '100vh',           
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    // While checking session, display loading
    return <div>Loading...</div>;
  }

  return (
    <div style={pageStyles}>
      <NavBar />
      <div>
        {session ? (
          <h1 className={`${poppins.className} mt-40 text-black text-center text-[5rem] font-[900] uppercase`}>
            Welcome,
            <br />
            <p className="text-black">
              {session.user.username}!
            </p>
          </h1>
        ) : (
          <h2 className={`${poppins.className} mt-40 text-black text-center text-[5rem] font-[900] uppercase`}>
            Welcome,
            <br />
            <p className="text-black">
              Guest
            </p>
          </h2>
        )}
      </div>
    </div>
  );
}
