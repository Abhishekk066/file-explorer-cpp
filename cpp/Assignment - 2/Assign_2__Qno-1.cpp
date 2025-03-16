#include <iostream>
using namespace std;

class student{
public:
    string name;
    int roll;

    void input(){
        cout << "Enter your name: ";
        cin >> name;
        cout << "Enter roll number: ";
        cin >> roll;
    }

    void display() {
        cout << "Name: " << name << endl;
        cout << "Roll: " << roll << endl;
    }
};

int main() {
    student s;
    s.input();
    s.display();
}
