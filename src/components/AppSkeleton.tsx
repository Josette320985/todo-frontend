import { Container, Navbar, Card, ListGroup } from 'react-bootstrap';
import Skeleton from './Skeleton';

export default function AppSkeleton() {
  return (
    <div className="bg-light min-vh-100 pb-5 position-fixed top-0 start-0 w-100 h-100 overflow-auto" style={{ zIndex: 5000 }} role="status" aria-label="Cargando la aplicación">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container className="d-flex align-items-center">
          <Skeleton width="7rem" height="1.25rem" className="me-auto" />
        </Container>
      </Navbar>
      <Container>
        <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: '600px' }}>
          <Card.Body>
            <Skeleton width="8rem" height="1.75rem" className="mb-4" />
            <Skeleton width="100%" height="2.375rem" className="mb-2" />
            <Skeleton width="100%" height="2.375rem" className="mb-2" />
            <Skeleton width="6rem" height="2.375rem" className="mb-4" />
            <ListGroup aria-hidden="true">
              {['85%', '70%', '78%'].map(width => (
                <ListGroup.Item key={width} className="d-flex align-items-center gap-3 py-3">
                  <Skeleton width="1rem" height="1rem" />
                  <Skeleton width={width} height="1rem" />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
