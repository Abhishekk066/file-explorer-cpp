#include <iostream>
using namespace std;

class Student {
public:
    string name;
    void input(string n = "Unknown") {
        name = n;
    }

    void display() {
        cout << "Name: " << name << endl;
    }
};


int main() {
    Student s1;
    s1.input("Abhishek");
    s1.display();

    Student s2;
    s2.input();
    s2.display();
    return 0;
}
