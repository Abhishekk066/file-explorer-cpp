#include <iostream>
using namespace std;

class calculate {
public:
    int l, b, h, area, volume;

    void input() {
        cout << "Enter Length: ";
        cin >> l;
        cout << "Enter Breadth: ";
        cin >> b;
        cout << "Enter Height: ";
        cin >> h;
    }

    void cal() {
        area = l * b;
        volume = l * b * h;
    }

    void display() {
        cout << "Area is " << area << endl;
        cout << "Volume is " << volume << endl;
    }
};

int main() {
    calculate c;
    c.input();
    c.cal();
    c.display();
    return 0;
}
