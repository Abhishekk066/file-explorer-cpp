#include <iostream>
using namespace std;

class Student {
private:
    int admno;
    string sname;
    float eng, math, science, total;

    float ctotal(float e, float m, float s) {
        return e + m + s;
    }

public:
    void takeData() {
        cout << "Enter Name: ";
        cin >> sname;
        cout << "Enter Adm No: ";
        cin >> admno;
        cout << "Enter English Marks: ";
        cin >> eng;
        cout << "Enter Math Marks: ";
        cin >> math;
        cout << "Enter Science Marks: ";
        cin >> science;

        total = ctotal(eng, math, science);
    }

    void showData() {
        cout << "Name: " << sname << endl;
        cout << "Adm No: " << admno << endl;
        cout << "Marks: " << total << endl;
    }
};


int main() {
    Student s;
    s.takeData();
    s.showData();
    return 0;
}
