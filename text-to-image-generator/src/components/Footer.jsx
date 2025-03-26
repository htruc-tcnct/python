import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer className="bg-dark text-light py-3">
      <Container className="text-center">
        <p className="mb-0">
          &copy; 2024 Text-To-Image Generator. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}

export default Footer;
