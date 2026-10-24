import pytest
pytest.importorskip("torch")
from app.ml.graph_dataset import EllipticDatasetLoader


def test_elliptic_loader_temporal_split():
    # Using mock loader
    loader = EllipticDatasetLoader(dataset_path="/invalid/path/for/mock")
    data = loader.load()
    
    # Verify temporal split integrity
    train_mask = data['tx'].train_mask
    test_mask = data['tx'].test_mask
    
    train_times = data['tx'].time[train_mask]
    test_times = data['tx'].time[test_mask]
    
    if len(train_times) > 0 and len(test_times) > 0:
        max_train_time = train_times.max().item()
        min_test_time = test_times.min().item()
        
        # Train times must be strictly before test times
        assert max_train_time < min_test_time
        
def test_elliptic_loader_schema():
    loader = EllipticDatasetLoader(dataset_path="/invalid/path/for/mock")
    data = loader.load()
    
    assert 'tx' in data.node_types
    assert ('tx', 'flow', 'tx') in data.edge_types
    
    # Check features and labels
    assert data['tx'].x is not None
    assert data['tx'].y is not None
    assert data['tx', 'flow', 'tx'].edge_index is not None
