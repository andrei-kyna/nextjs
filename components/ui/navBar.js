import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; 
import routes from '@/routes';
import { useState, useEffect } from "react";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false); // Scroll state to control appearance
  const { data: session, status } = useSession(); // Get session data

  // Function to handle scroll detection
  const handleScroll = () => {
    if (window.scrollY > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Define dynamic styles based on scroll state
  const dynamicNavStyles = {
    ...navStyles,
    backgroundColor: scrolled ? '#333' : '#000', // Darker navbar on scroll
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  return (
    <nav style={dynamicNavStyles}>
      <ul style={ulStyles}>
        <li style={liStyles}>
          <Link href={routes.home} style={linkStyles}>Home</Link>
        </li>
        <li style={liStyles}>
          <Link href={routes.about} style={linkStyles}>About</Link>
        </li>
        <li style={liStyles}>
          <Link href={routes.contact} style={linkStyles}>Contact</Link>
        </li>
        {session ? (
          <>
            <li style={liStyles}>
              <Link href={routes.employee} style={linkStyles}>Employee</Link>
            </li>
            <li style={liStyles}>
              <Link href={routes.timesheet} style={linkStyles}>Timesheet</Link>
            </li>
            <li style={liStyles}>
              <Link href={routes.inquiries} style={linkStyles}>Inquiries</Link>
            </li>
            <li style={liStyles}>
              <button style={linkStyles} onClick={() => signOut({ callbackUrl: routes.home })}>Logout</button>
            </li>
          </>
        ) : (
          <li style={liStyles}>
            <Link href={routes.login} style={linkStyles}>Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

// CSS styles for NavBar (same as code 2)
const navStyles = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  padding: '1rem',
  color: '#fff',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
};
const ulStyles = {
  display: 'flex',
  listStyleType: 'none',
  margin: '0',
  padding: '0',
  justifyContent: 'center',
  gap: '20px',
};
const liStyles = {
  marginRight: '20px',
};
const linkStyles = {
  color: '#fff',
  textDecoration: 'none',
};