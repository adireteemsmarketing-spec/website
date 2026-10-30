from fastapi import FastAPI
from fastapi.testclient import TestClient
from middleware.logging import ErrorHandlingMiddleware


def test_internal_exception_details_never_reach_the_client():
    app = FastAPI()
    app.add_middleware(ErrorHandlingMiddleware)

    @app.get('/fail')
    def fail():
        raise RuntimeError('private database credentials and connection details')

    response = TestClient(app, raise_server_exceptions=False).get('/fail')
    assert response.status_code == 500
    assert response.json() == {'detail': 'Internal server error'}
