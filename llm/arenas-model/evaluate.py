from sklearn.base import r2_score

def train_and_evaluate(model, X_train, X_test, y_train=None, y_test=None, task_type='regression'):
    model.fit(X_train, y_train) if y_train is not None else model.fit(X_train)
    if task_type == 'regression':
        predictions = model.predict(X_test)
        score = r2_score(y_test, predictions)
    elif task_type == 'classification':
        predictions = model.predict(X_test)
        from sklearn.metrics import accuracy_score
        score = accuracy_score(y_test, predictions)
    elif task_type == 'clustering':
        predictions = model.predict(X_test)
        # Clustering evaluation can be more complex
        score = None  # Placeholder
    return model, score
