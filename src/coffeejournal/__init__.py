from flask import Flask
from flask_cors import CORS
import os
from .repositories.factory import init_repository_factory


def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load config
    if test_config is None:
        # Load the instance config, if it exists, when not testing
        # Use DATA_DIR environment variable or default to test_data
        default_data_dir = os.environ.get('DATA_DIR', 'test_data')
        # Convert relative paths to absolute paths based on project root
        if not os.path.isabs(default_data_dir):
            # Go up from src/coffeejournal to project root
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            default_data_dir = os.path.join(project_root, default_data_dir)
        
        app.config.from_mapping(
            SECRET_KEY='dev',
            DATA_DIR=default_data_dir
        )
        # Note: No longer using Flask instance config files
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Ensure the data directory exists
    try:
        os.makedirs(app.config['DATA_DIR'], exist_ok=True)
    except OSError:
        pass
    
    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize repository factory
    init_repository_factory(
        storage_type='json',
        data_dir=app.config['DATA_DIR']
    )
    
    # Register blueprints
    from .main import api
    app.register_blueprint(api)
    
    return app