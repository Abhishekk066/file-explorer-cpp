#include <iostream>
using namespace std;

class BaseClass {
public:
    string name;
    int age;

    void getData();
    void display();
};

void BaseClass::getData() {
    cout << "Enter your name: ";
    cin >> name;
    cout << "Enter your age: ";
    cin >> age;
}

void BaseClass::display() {
    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
}

class DerivedClass : public BaseClass {
public:
    float salary;
    string address;

    void getData() {
        BaseClass::getData();
        cout << "Enter your salary: ";
        cin >> salary;
        cout << "Enter your address: ";
        cin >> address;
    }

    void display() {
        BaseClass::display();
        cout << "Salary: " << salary << endl;
        cout << "Address: " << address << endl;
    }
};

int main() {
    DerivedClass obj;
    obj.getData();
    obj.display();
    return 0;
}
