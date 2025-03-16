#include <iostream>
using namespace std;

double add(double x, double y) {
    return x + y;
}

double sub(double x,  double y){
    return x - y;
}

double divide(double x, double y) {
    if (y == 0) {
        cout << "Error" << endl;
        return 0;
    }
    return x / y;
}

double multiply(double x, double y) {
    return x * y;
}

int main() {
    int choice;
    double num1, num2, result = 0;

    while (true) {
        cout << "1. Add" << endl;
        cout << "2. Divide" << endl;
        cout << "3. Multiply" << endl;
        cout << "4. subtract" << endl;
        cout << "5. Exit" << endl;
        cout << "Enter your choice: ";
        cin >> choice;
        cout << endl;

        switch(choice) {
            case 1:
                cout << "Enter two numbers: ";
                cin >> num1 >> num2;
                result = add(num1, num2);
                cout << "Result: " << result << endl;
                break;
            case 2:
                cout << "Enter two numbers: ";
                cin >> num1 >> num2;
                result = divide(num1, num2);
                cout << "Result: " << result << endl;
                break;
            case 3:
                cout << "Enter two numbers: ";
                cin >> num1 >> num2;
                result = multiply(num1, num2);
                cout << "Result: " << result << endl;
                break;
            case 4:
                cout << "Enter two numbers: ";
                cin >> num1 >> num2;
                result = sub(num1, num2);
                cout << "Result: " << result << endl;
                break;
                break;
            case 5:
                return 0;
                break;
            default:
                cout << "Invalid choice, please try again!" << endl;
        }
    }

    return 0;
}
